import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { LZTService } from '../services/lztService';
import { createAccountEmbeds } from '../utils/embedBuilder';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('conta')
  .setDescription('Mostra detalhes de uma conta específica')
  .addIntegerOption(option =>
    option
      .setName('id')
      .setDescription('ID da conta (ex: 123456)')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  lztService: LZTService,
  cacheService?: any
): Promise<void> {
  // Verificar se já foi deferido antes de tentar novamente
  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply();
    } catch (error: any) {
      // Se já foi deferido por outro handler, continuar
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
    const itemId = interaction.options.getInteger('id', true);

    const account = await lztService.getAccountDetails(itemId);

    // Log para debug
    logger.info(`[DEBUG] Dados da conta ${itemId} recebidos:`);
    logger.info(`[DEBUG] account.account_info existe? ${!!account.account_info}`);
    logger.info(`[DEBUG] account.account_info?.weapon_skins existe? ${!!account.account_info?.weapon_skins}`);
    logger.info(`[DEBUG] account.account_info?.weapon_skins length: ${account.account_info?.weapon_skins?.length || 0}`);
    
    if (account.account_info?.weapon_skins && account.account_info.weapon_skins.length > 0) {
      logger.info(`[DEBUG] Primeira skin:`, JSON.stringify(account.account_info.weapon_skins[0], null, 2));
    } else {
      logger.info(`[DEBUG] Estrutura completa da conta:`, JSON.stringify({
        item_id: account.item_id,
        has_account_info: !!account.account_info,
        account_info_keys: account.account_info ? Object.keys(account.account_info) : [],
        all_keys: Object.keys(account),
      }, null, 2));
    }

    const result = await createAccountEmbeds(account, lztService, cacheService);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_account_${account.item_id}`)
        .setLabel('🛒 Comprar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`view_account_${account.item_id}`)
        .setLabel('ℹ️ Mais Informações')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(`R$ ${account.price.toFixed(2)}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.editReply({
      embeds: result.embeds,
      files: result.files,
      components: [row],
    });
  } catch (error: any) {
    logger.error('Erro ao buscar conta', error);
    
    let errorMessage = '❌ Erro ao buscar conta.';
    
    if (error.statusCode === 404) {
      errorMessage = '❌ Conta não encontrada. Verifique o ID e tente novamente.';
    } else if (error.statusCode === 403) {
      errorMessage = '❌ Sem permissão para acessar esta conta.';
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}

