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
import * as adicionarsaldoCommand from './commands/adicionarsaldo';
import * as meusaldoCommand from './commands/meusaldo';
import { WebhookServer } from './server/webhookServer';

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

// Inicializa serviços EfiBank (opcional - só se configurado)
let efiService: any = null;
let balanceService: any = null;

// Função para inicializar serviços EfiBank
async function initializeEfiServices() {
  try {
    if (process.env.EFI_CLIENT_ID && process.env.EFI_CLIENT_SECRET) {
      const { EfiService } = await import('./services/efiService');
      const { BalanceService } = await import('./services/balanceService');
      
      try {
        efiService = new EfiService();
        balanceService = new BalanceService(efiService);
        logger.info('Serviços EfiBank inicializados com sucesso');
        return true;
      } catch (efiError: any) {
        // Erro específico do EfiService (ex: certificado não encontrado)
        logger.warn('Erro ao inicializar EfiService:', efiError.message);
        logger.warn('Comando /adicionarsaldo não estará totalmente funcional até configurar o certificado');
        // Ainda permite registrar o comando, mas ele mostrará erro ao usar
        return false;
      }
    } else {
      logger.warn('Serviços EfiBank não inicializados (credenciais não configuradas)');
      return false;
    }
  } catch (error: any) {
    logger.warn('Erro ao inicializar serviços EfiBank:', error.message);
    logger.warn('Comando /adicionarsaldo não estará disponível');
    return false;
  }
}

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
commands.set(meusaldoCommand.data.name, meusaldoCommand as Command);

// Registra comando de adicionar saldo (será registrado após inicialização dos serviços)

// Inicializa servidor webhook (se configurado)
let webhookServer: any = null;
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3000', 10);
const WEBHOOK_ENABLED = process.env.WEBHOOK_ENABLED === 'true';

// Função para inicializar webhook
async function initializeWebhookServer() {
  if (WEBHOOK_ENABLED) {
    try {
      webhookServer = new WebhookServer(WEBHOOK_PORT);
      await webhookServer.start();
      logger.info(`[WEBHOOK] Servidor webhook habilitado na porta ${WEBHOOK_PORT}`);
    } catch (error: any) {
      logger.error('[WEBHOOK] Erro ao iniciar servidor webhook:', error);
      logger.warn('[WEBHOOK] Bot continuará sem webhook (confirmação manual necessária)');
    }
  } else {
    logger.info('[WEBHOOK] Servidor webhook desabilitado (WEBHOOK_ENABLED=false ou não configurado)');
  }
}

// Inicializa webhook em paralelo
initializeWebhookServer().catch((error) => {
  logger.error('[WEBHOOK] Erro fatal ao inicializar webhook:', error);
});

// Evento: Bot pronto
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Bot conectado como ${readyClient.user.tag}!`);
  logger.info(`Bot ID: ${readyClient.user.id}`);
  
  // Inicializa serviços EfiBank se disponíveis
  const efiInitialized = await initializeEfiServices();
  
  // Registra comandos de saldo se credenciais estiverem configuradas
  // (mesmo que o certificado não esteja, para mostrar mensagem de erro útil)
  if (process.env.EFI_CLIENT_ID && process.env.EFI_CLIENT_SECRET) {
    commands.set(adicionarsaldoCommand.data.name, adicionarsaldoCommand as Command);
    commands.set(meusaldoCommand.data.name, meusaldoCommand as Command);
    if (!efiInitialized || !balanceService) {
      logger.warn('Comandos de saldo registrados, mas não funcionarão até configurar o certificado .p12');
    }
  }
  
  // Registra comandos slash
  try {
    const commandsData = Array.from(commands.values()).map((cmd) => cmd.data);
    logger.info(`[COMANDOS] Registrando ${commandsData.length} comandos:`);
    commandsData.forEach(cmd => {
      logger.info(`[COMANDOS]   - /${cmd.name}: ${cmd.description}`);
      // Log detalhado dos parâmetros
      if (cmd.options && cmd.options.length > 0) {
        cmd.options.forEach((opt: any) => {
          logger.info(`[COMANDOS]     └─ ${opt.name} (${opt.type === 3 ? 'STRING' : opt.type === 4 ? 'NUMBER' : opt.type}): ${opt.description}`);
        });
      }
    });
    
    // Tenta registrar comandos globalmente primeiro
    await readyClient.application?.commands.set(commandsData);
    logger.info('[COMANDOS] Comandos slash registrados globalmente!');
    
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
        await command.execute(interaction, purchaseService, balanceService);
      } else if (interaction.commandName === 'adicionarsaldo') {
        if (!balanceService) {
          await interaction.reply({
            content: '❌ **Serviço de saldo não está disponível**\n\n' +
              'Configure as credenciais da EfiBank no Railway:\n' +
              '- `EFI_CLIENT_ID`\n' +
              '- `EFI_CLIENT_SECRET`\n' +
              '- `EFI_CERTIFICATE_PATH` (caminho para o arquivo .p12)',
            ephemeral: true,
          });
          return;
        }
        await command.execute(interaction, balanceService);
      } else if (interaction.commandName === 'meusaldo') {
        if (!balanceService) {
          await interaction.reply({
            content: '❌ **Serviço de saldo não está disponível**\n\n' +
              'Configure as credenciais da EfiBank no Railway.',
            ephemeral: true,
          });
          return;
        }
        await command.execute(interaction, balanceService);
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
      await handleButtonInteraction(interaction, lztService, purchaseService, balanceService);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Recebido SIGINT, encerrando...');
  if (webhookServer) {
    await webhookServer.stop();
  }
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Recebido SIGTERM, encerrando...');
  if (webhookServer) {
    await webhookServer.stop();
  }
  client.destroy();
  process.exit(0);
});

// Conecta o bot
client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  logger.error('Erro ao fazer login', error);
  process.exit(1);
});

