import { Client, GatewayIntentBits, Collection, Events, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { LZTService } from './services/lztService';
import { PurchaseService } from './services/purchaseService';
import { handleButtonInteraction } from './handlers/buttonHandler';
import { handleModalInteraction } from './handlers/modalHandler';
import { logger } from './utils/logger';
import * as contasCommand from './commands/contas';
import * as contaCommand from './commands/conta';
import * as adminCommand from './commands/admin';

// Tipo para comandos
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, ...args: any[]) => Promise<void>;
}

// Carrega variáveis de ambiente
dotenv.config();

// Validação de variáveis obrigatórias
if (!process.env.DISCORD_BOT_TOKEN) {
  logger.error('DISCORD_BOT_TOKEN não encontrado no .env');
  process.exit(1);
}

if (!process.env.LZT_API_TOKEN) {
  logger.error('LZT_API_TOKEN não encontrado no .env');
  process.exit(1);
}

// Inicializa serviços
const lztService = new LZTService(
  process.env.LZT_API_TOKEN,
  process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'
);

const purchaseService = new PurchaseService(lztService);

// Cria cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Coleção de comandos
const commands = new Collection<string, Command>();

// Registra comandos
commands.set(contasCommand.data.name, contasCommand as Command);
commands.set(contaCommand.data.name, contaCommand as Command);
commands.set(adminCommand.data.name, adminCommand as Command);

// Evento: Bot pronto
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Bot conectado como ${readyClient.user.tag}!`);
  logger.info(`Bot ID: ${readyClient.user.id}`);
  
  // Registra comandos slash
  try {
    const commandsData = Array.from(commands.values()).map((cmd) => cmd.data);
    logger.info(`Registrando ${commandsData.length} comandos:`, commandsData.map((c) => c.name));
    
    // Tenta registrar comandos globalmente primeiro
    await readyClient.application?.commands.set(commandsData);
    logger.info('Comandos slash registrados globalmente!');
    
    // Também registra em cada servidor (mais rápido para aparecer)
    const guilds = await readyClient.guilds.fetch();
    logger.info(`Registrando comandos em ${guilds.size} servidor(es)...`);
    
    for (const [guildId, guildPartial] of guilds) {
      try {
        const guild = await guildPartial.fetch();
        if (guild.commands) {
          const guildCommands = await guild.commands.set(commandsData);
          logger.info(`  ✓ Comandos registrados no servidor: ${guild.name} (${guildCommands.size} comandos)`);
        } else {
          logger.warn(`  ✗ Servidor ${guild.name} não tem permissão para comandos`);
        }
      } catch (guildError: any) {
        logger.warn(`  ✗ Erro ao registrar comandos no servidor ${guildPartial.name || guildId}:`, guildError.message || guildError);
      }
    }
    
    // Lista comandos registrados para debug
    const registeredCommands = await readyClient.application?.commands.fetch();
    logger.info(`Total de comandos registrados globalmente: ${registeredCommands?.size || 0}`);
    registeredCommands?.forEach(cmd => {
      logger.info(`  - /${cmd.name}: ${cmd.description}`);
    });
  } catch (error: any) {
    logger.error('Erro ao registrar comandos', error);
    logger.error('Stack:', error.stack);
  }
});

// Evento: Interação de comando slash
client.on(Events.InteractionCreate, async (interaction) => {
  logger.info(`[DEBUG] Interação recebida! Tipo: ${interaction.type}, ID: ${interaction.id}, Usuário: ${interaction.user.tag}, Canal: ${interaction.channel?.id}`);
  
  // Log adicional para debug
  if (interaction.isChatInputCommand()) {
    logger.info(`[DEBUG] É um comando slash! Nome: ${interaction.commandName}`);
  } else if (interaction.isButton()) {
    logger.info(`[DEBUG] É um botão! ID: ${interaction.customId}`);
  } else if (interaction.isModalSubmit()) {
    logger.info(`[DEBUG] É um modal! ID: ${interaction.customId}`);
  }
  
  if (interaction.isChatInputCommand()) {
    logger.info(`Comando slash recebido: /${interaction.commandName} de ${interaction.user.tag} no servidor ${interaction.guild?.name || 'DM'}`);
    
    const command = commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Comando não encontrado: ${interaction.commandName}`);
      await interaction.reply({
        content: `❌ Comando \`/${interaction.commandName}\` não encontrado.`,
        ephemeral: true,
      });
      return;
    }

    try {
      // Executa comando com serviços necessários
      if (interaction.commandName === 'contas' || interaction.commandName === 'conta') {
        await command.execute(interaction, lztService);
      } else if (interaction.commandName === 'admin') {
        await command.execute(interaction, purchaseService);
      } else {
        await command.execute(interaction);
      }
    } catch (error: any) {
      logger.error(`Erro ao executar comando ${interaction.commandName}`, error);
      logger.error('Stack:', error.stack);
      
      const errorMessage = {
        content: `❌ Ocorreu um erro ao executar este comando: ${error.message || 'Erro desconhecido'}`,
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        logger.error('Erro ao enviar mensagem de erro', replyError);
      }
    }
  } else if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction, lztService, purchaseService);
    } catch (error) {
      logger.error('Erro ao processar interação de botão', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar ação.',
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isModalSubmit()) {
    try {
      await handleModalInteraction(interaction, purchaseService);
    } catch (error) {
      logger.error('Erro ao processar modal', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Erro ao processar formulário.',
          ephemeral: true,
        });
      }
    }
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Conecta o bot
client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  logger.error('Erro ao fazer login', error);
  process.exit(1);
});

