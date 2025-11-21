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

  if (action === 'start') {
    // Verificar se já foi deferido antes de tentar novamente
    if (!interaction.deferred && !interaction.replied) {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (error: any) {
        // Se já foi deferido, continuar
        if (error.code === 40060) {
          logger.warn('Interação já foi deferida, continuando...');
        } else {
          logger.error('Erro ao fazer deferReply', error);
          try {
            if (!interaction.replied) {
              await interaction.reply({
                content: '❌ Erro ao processar comando.',
                ephemeral: true,
              });
            }
          } catch {}
          return;
        }
      }
    }

    // Usar o canal onde o comando foi executado
    const channelId = interaction.channelId;

    if (!channelId) {
      try {
        await interaction.editReply({
          content: '❌ **Erro**\n\nNão foi possível identificar o canal. Execute o comando em um canal de texto.',
        });
      } catch {
        await interaction.followUp({
          content: '❌ **Erro**\n\nNão foi possível identificar o canal. Execute o comando em um canal de texto.',
          ephemeral: true,
        });
      }
      return;
    }

    if (!client) {
      try {
        await interaction.editReply({
          content: '❌ Cliente Discord não disponível.',
        });
      } catch {
        await interaction.followUp({
          content: '❌ Cliente Discord não disponível.',
          ephemeral: true,
        });
      }
      return;
    }

    // Verificar se o canal é um TextChannel
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      try {
        await interaction.editReply({
          content: '❌ **Erro**\n\nO canal precisa ser um canal de texto.',
        });
      } catch {
        await interaction.followUp({
          content: '❌ **Erro**\n\nO canal precisa ser um canal de texto.',
          ephemeral: true,
        });
      }
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

        await interaction.editReply({
          embeds: [embed],
        });
      } else {
        await interaction.editReply({
          content: `❌ **Erro ao iniciar publicação automática**\n\n${result.error || 'Erro desconhecido'}`,
        });
      }
    } catch (error: any) {
      logger.error('Erro ao iniciar publicação automática', error);
      try {
        await interaction.editReply({
          content: `❌ **Erro ao iniciar publicação automática**\n\n${error.message || 'Erro desconhecido'}`,
        });
      } catch (editError: any) {
        // Se já foi respondido ou expirado, tentar followUp
        try {
          await interaction.followUp({
            content: `❌ **Erro ao iniciar publicação automática**\n\n${error.message || 'Erro desconhecido'}`,
            ephemeral: true,
          });
        } catch (followUpError) {
          logger.error('Erro ao enviar mensagem de erro (tanto editReply quanto followUp falharam)', followUpError);
        }
      }
    }
  } else if (action === 'stop') {
    // Verificar se já foi deferido antes de tentar novamente
    if (!interaction.deferred && !interaction.replied) {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (error: any) {
        // Se já foi deferido, continuar
        if (error.code === 40060) {
          logger.warn('Interação já foi deferida, continuando...');
        } else {
          logger.error('Erro ao fazer deferReply', error);
          try {
            if (!interaction.replied) {
              await interaction.reply({
                content: '❌ Erro ao processar comando.',
                ephemeral: true,
              });
            }
          } catch {}
          return;
        }
      }
    }

    try {
      const result = accountPublisher.stop();

      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle('⏹️ Publicação Automática Parada')
          .setDescription('A publicação automática de contas foi parada com sucesso.')
          .setColor(0xff9900)
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
        });
      } else {
        await interaction.editReply({
          content: `❌ **Erro ao parar publicação automática**\n\n${result.error || 'Erro desconhecido'}`,
        });
      }
    } catch (error: any) {
      logger.error('Erro ao parar publicação automática', error);
      try {
        await interaction.editReply({
          content: `❌ **Erro ao parar publicação automática**\n\n${error.message || 'Erro desconhecido'}`,
        });
      } catch (editError: any) {
        try {
          await interaction.followUp({
            content: `❌ **Erro ao parar publicação automática**\n\n${error.message || 'Erro desconhecido'}`,
            ephemeral: true,
          });
        } catch (followUpError) {
          logger.error('Erro ao enviar mensagem de erro (tanto editReply quanto followUp falharam)', followUpError);
        }
      }
    }
  } else {
    await interaction.reply({
      content: '❌ Ação inválida. Use "start" ou "stop".',
      ephemeral: true,
    });
  }
}

