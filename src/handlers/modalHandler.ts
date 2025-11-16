import { ModalSubmitInteraction } from 'discord.js';
import { PurchaseService } from '../services/purchaseService';
import { logger } from '../utils/logger';

/**
 * Handler para modais (confirmação de pagamento)
 */
export async function handleModalInteraction(
  interaction: ModalSubmitInteraction,
  purchaseService: PurchaseService
): Promise<void> {
  const customId = interaction.customId;

  // Confirmação de pagamento
  if (customId.startsWith('confirm_payment_')) {
    const orderId = customId.replace('confirm_payment_', '');
    const paymentProof = interaction.fields.getTextInputValue('payment_proof');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Aqui você pode adicionar lógica para notificar o admin sobre o pagamento
      // Por enquanto, vamos apenas registrar e informar o usuário

      logger.info(`Pagamento confirmado para pedido ${orderId}`, {
        user: interaction.user.id,
        paymentProof,
      });

      await interaction.editReply({
        content: `✅ Pedido registrado! Seu comprovante foi recebido.\n\n` +
                 `**ID do Pedido:** \`${orderId}\`\n` +
                 `Aguarde a confirmação do pagamento. Você receberá os dados da conta via DM assim que o pagamento for confirmado.\n\n` +
                 `⚠️ **Importante:** Mantenha este ID do pedido para referência.`,
      });

      // TODO: Notificar admin sobre novo pagamento pendente
      // Você pode enviar uma mensagem para um canal específico ou DM para o admin
    } catch (error: any) {
      logger.error('Erro ao processar confirmação de pagamento', error);
      await interaction.editReply({
        content: '❌ Erro ao processar confirmação de pagamento. Tente novamente.',
      });
    }
    return;
  }

  await interaction.reply({
    content: '❌ Modal não reconhecido.',
    ephemeral: true,
  });
}

