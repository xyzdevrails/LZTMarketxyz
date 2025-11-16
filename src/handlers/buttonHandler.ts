import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { LZTService } from '../services/lztService';
import { PurchaseService } from '../services/purchaseService';
import { createAccountEmbed } from '../utils/embedBuilder';
import { logger } from '../utils/logger';
// Navegação de páginas removida

/**
 * Handler para botões interativos
 */
export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  lztService: LZTService,
  purchaseService: PurchaseService
): Promise<void> {
  const customId = interaction.customId;

  // Ver conta específica
  if (customId.startsWith('view_account_')) {
    const itemId = parseInt(customId.replace('view_account_', ''));
    
    await interaction.deferReply({ ephemeral: true });

    try {
      const account = await lztService.getAccountDetails(itemId);
      const embed = createAccountEmbed(account);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_account_${account.item_id}`)
          .setLabel('🛒 Comprar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`price_display_${account.item_id}`)
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
      await interaction.editReply({
        content: '❌ Erro ao buscar detalhes da conta.',
      });
    }
    return;
  }

  // Comprar conta
  if (customId.startsWith('buy_account_')) {
    const itemId = parseInt(customId.replace('buy_account_', ''));

    try {
      // Verifica disponibilidade
      const account = await lztService.getAccountDetails(itemId);

      if (account.is_purchased) {
        await interaction.reply({
          content: '❌ Esta conta já foi vendida.',
          ephemeral: true,
        });
        return;
      }

      // Cria pedido pendente
      const order = await purchaseService.createPendingOrder(
        itemId,
        interaction.user,
        account.price,
        account.currency || 'BRL'
      );

      // Cria modal para confirmação de pagamento
      const modal = new ModalBuilder()
        .setCustomId(`confirm_payment_${order.order_id}`)
        .setTitle('Confirmar Pagamento');

      const paymentInput = new TextInputBuilder()
        .setCustomId('payment_proof')
        .setLabel('Comprovante de Pagamento')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Cole o link do comprovante ou descreva o método de pagamento usado')
        .setRequired(true);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(paymentInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } catch (error: any) {
      logger.error('Erro ao iniciar compra', error);
      await interaction.reply({
        content: `❌ Erro ao processar compra: ${error.message}`,
        ephemeral: true,
      });
    }
    return;
  }

  // Navegação de páginas removida - não há mais paginação

  // Confirmação de pagamento (via modal submit)
  if (customId.startsWith('confirm_payment_')) {
    // Este será tratado no modalHandler
    return;
  }

  await interaction.reply({
    content: '❌ Ação não reconhecida.',
    ephemeral: true,
  });
}

