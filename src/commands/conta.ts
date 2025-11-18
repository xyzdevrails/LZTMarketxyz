import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { LZTService } from '../services/lztService';
import { createAccountEmbed } from '../utils/embedBuilder';
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
  lztService: LZTService
): Promise<void> {
  await interaction.deferReply();

  try {
    const itemId = interaction.options.getInteger('id', true);

    const account = await lztService.getAccountDetails(itemId);

    const embed = createAccountEmbed(account);

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
      embeds: [embed],
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

