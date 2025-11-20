import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  Client,
} from 'discord.js';
import { AccountPublisher } from '../services/accountPublisher';
import { logger } from '../utils/logger';

let accountPublisher: AccountPublisher | null = null;

export function setAccountPublisher(publisher: AccountPublisher) {
  accountPublisher = publisher;
}

export const data = new SlashCommandBuilder()
  .setName('generate')
  .setDescription('Gerencia publicação automática de contas')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(option =>
    option
      .setName('action')
      .setDescription('Ação a ser executada: "start" para iniciar, "stop" para parar')
      .setRequired(true)
      .addChoices(
        { name: 'Iniciar', value: 'start' },
        { name: 'Parar', value: 'stop' }
      )
  )
  .addStringOption(option =>
    option
      .setName('canal')
      .setDescription('ID do canal onde publicar (obrigatório para "start")')
      .setRequired(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  if (!accountPublisher) {
    await interaction.reply({
      content: '❌ Serviço de publicação não está disponível.',
      ephemeral: true,
    });
    return;
  }

  const action = interaction.options.getString('action', true);
  const channelId = interaction.options.getString('canal');

  if (action === 'start') {
    if (!channelId) {
      await interaction.reply({
        content: '❌ **Canal obrigatório**\n\nVocê precisa informar o ID do canal onde as contas serão publicadas.\n\n**Exemplo:** `/generate action:start canal:123456789012345678`',
        ephemeral: true,
      });
      return;
    }

    if (!client) {
      await interaction.reply({
        content: '❌ Cliente Discord não disponível.',
        ephemeral: true,
      });
      return;
    }

    try {
      const result = await accountPublisher.start(client, channelId);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Publicação Automática Iniciada')
          .setDescription(
            `A publicação automática de contas foi iniciada com sucesso!\n\n` +
            `**Canal:** <#${channelId}>\n` +
            `**Intervalo:** A cada 1 hora\n` +
            `**Filtros:**\n` +
            `• País: Brasil\n` +
            `• Região: BR\n` +
            `• Mínimo de skins: 3\n` +
            `• Nível mínimo: 20\n` +
            `• Apenas contas das últimas 48 horas\n\n` +
            `O bot irá publicar automaticamente novas contas que atendam esses critérios.`
          )
          .setColor(0x00ff00)
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ **Erro ao iniciar publicação automática**\n\n${result.error || 'Erro desconhecido'}`,
          ephemeral: true,
        });
      }
    } catch (error: any) {
      logger.error('Erro ao iniciar publicação automática', error);
      await interaction.reply({
        content: `❌ **Erro ao iniciar publicação automática**\n\n${error.message || 'Erro desconhecido'}`,
        ephemeral: true,
      });
    }
  } else if (action === 'stop') {
    const result = accountPublisher.stop();

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle('⏹️ Publicação Automática Parada')
        .setDescription('A publicação automática de contas foi parada com sucesso.')
        .setColor(0xff9900)
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ **Erro ao parar publicação automática**\n\n${result.error || 'Erro desconhecido'}`,
        ephemeral: true,
      });
    }
  } else {
    await interaction.reply({
      content: '❌ Ação inválida. Use "start" ou "stop".',
      ephemeral: true,
    });
  }
}

