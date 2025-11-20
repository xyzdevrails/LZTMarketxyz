import { ModalSubmitInteraction } from 'discord.js';
import { PurchaseService } from '../services/purchaseService';
import { BalanceService } from '../services/balanceService';
import { orderStorage } from '../storage/orders';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function handleModalInteraction(
  interaction: ModalSubmitInteraction,
  purchaseService: PurchaseService,
  balanceService?: BalanceService
): Promise<void> {
  const customId = interaction.customId;

  // Compra com saldo automático
  if (customId.startsWith('confirm_balance_purchase_')) {
    const orderId = customId.replace('confirm_balance_purchase_', '');
    const confirmText = interaction.fields.getTextInputValue('confirm_text');

    await interaction.deferReply({ ephemeral: true });

    if (!balanceService) {
      await interaction.editReply({
        content: '❌ **Serviço de saldo não está disponível**\n\n' +
          'Configure as credenciais da EfiBank no Railway.',
      });
      return;
    }

    if (confirmText.toUpperCase() !== 'CONFIRMAR') {
      await interaction.editReply({
        content: '❌ Confirmação inválida. Por favor, digite exatamente "CONFIRMAR" para prosseguir.',
      });
      return;
    }

    let transactionId: string | null = null;
    let balanceDebited = false;
    
    try {
      const order = orderStorage.getOrder(orderId);

      if (!order) {
        await interaction.editReply({
          content: '❌ Pedido não encontrado.',
        });
        return;
      }

      if (order.user_id !== interaction.user.id) {
        await interaction.editReply({
          content: '❌ Você não tem permissão para processar este pedido.',
        });
        return;
      }

      if (order.status !== 'pending') {
        await interaction.editReply({
          content: `❌ Este pedido já foi processado (status: ${order.status}).`,
        });
        return;
      }

      // Verificar saldo novamente antes de processar
      if (!balanceService.hasSufficientBalance(interaction.user.id, order.price)) {
        await interaction.editReply({
          content: `❌ **Saldo Insuficiente**\n\n` +
                   `Você não tem saldo suficiente para esta compra.\n` +
                   `Use \`/meusaldo\` para verificar seu saldo atual.`,
        });
        return;
      }

      // Debitar saldo antes de comprar
      transactionId = `purchase_${uuidv4()}`;
      
      const debitResult = await balanceService.debitUserBalance(
        interaction.user.id,
        order.price,
        transactionId,
        `Compra de conta LZT - Item ID: ${order.item_id}`
      );

      if (!debitResult.success) {
        await interaction.editReply({
          content: `❌ Erro ao debitar saldo: ${debitResult.error || 'Erro desconhecido'}`,
        });
        return;
      }

      balanceDebited = true;

      // Processar compra na LZT
      const purchaseResult = await purchaseService.confirmPurchase(orderId);

      if (!purchaseResult.success || !purchaseResult.accountData) {
        // Reembolsar saldo se compra falhar
        await balanceService.refundUserBalance(
          interaction.user.id,
          order.price,
          transactionId,
          `Reembolso - Compra falhou: ${purchaseResult.error || 'Erro desconhecido'}`
        );

        logger.warn(`Compra falhou para pedido ${orderId}, saldo reembolsado`, {
          userId: interaction.user.id,
          error: purchaseResult.error,
        });

        await interaction.editReply({
          content: `❌ **Erro ao processar compra**\n\n` +
                   `**Erro:** ${purchaseResult.error || 'Erro desconhecido'}\n\n` +
                   `💰 Seu saldo foi reembolsado automaticamente.\n` +
                   `**Saldo atual:** R$ ${balanceService.getUserBalance(interaction.user.id).toFixed(2)}`,
        });
        return;
      }

      // Enviar credenciais via DM
      const accountData = purchaseResult.accountData;
      const credentialsMessage = 
        `✅ **Compra Realizada com Sucesso!**\n\n` +
        `**ID do Pedido:** \`${orderId}\`\n` +
        `**Item ID:** ${order.item_id}\n` +
        `**Valor:** R$ ${order.price.toFixed(2)}\n\n` +
        `**Credenciais da Conta:**\n` +
        `\`\`\`\n` +
        `${accountData.login ? `Login: ${accountData.login}\n` : ''}` +
        `${accountData.password ? `Senha: ${accountData.password}\n` : ''}` +
        `${accountData.email ? `Email: ${accountData.email}\n` : ''}` +
        `${accountData.email_password ? `Senha do Email: ${accountData.email_password}\n` : ''}` +
        `${accountData.phone ? `Telefone: ${accountData.phone}\n` : ''}` +
        `${accountData.recovery_codes ? `Códigos de Recuperação:\n${accountData.recovery_codes.join('\n')}\n` : ''}` +
        `\`\`\`\n\n` +
        `⚠️ **Importante:** Guarde essas informações em local seguro!\n\n` +
        `💰 **Saldo Restante:** R$ ${balanceService.getUserBalance(interaction.user.id).toFixed(2)}`;

      try {
        await interaction.user.send(credentialsMessage);
        await interaction.editReply({
          content: `✅ **Compra realizada com sucesso!**\n\n` +
                   `💰 **Valor debitado:** R$ ${order.price.toFixed(2)}\n` +
                   `💵 **Saldo restante:** R$ ${balanceService.getUserBalance(interaction.user.id).toFixed(2)}\n\n` +
                   `📩 As credenciais da conta foram enviadas via DM.`,
        });

        logger.info(`Compra com saldo concluída: ${orderId} para usuário ${interaction.user.tag} (${interaction.user.id})`);
      } catch (dmError: any) {
        logger.error('Erro ao enviar DM com credenciais', dmError);
        
        // Se não conseguir enviar DM, mostrar credenciais na resposta
        await interaction.editReply({
          content: `✅ **Compra realizada com sucesso!**\n\n` +
                   `💰 **Valor debitado:** R$ ${order.price.toFixed(2)}\n` +
                   `💵 **Saldo restante:** R$ ${balanceService.getUserBalance(interaction.user.id).toFixed(2)}\n\n` +
                   `⚠️ **Não foi possível enviar DM. Credenciais:**\n\`\`\`\n${JSON.stringify(accountData, null, 2)}\`\`\``,
        });
      }

    } catch (error: any) {
      logger.error('Erro ao processar compra com saldo', error);
      
      // Tentar reembolsar em caso de erro inesperado (apenas se o saldo foi debitado)
      if (balanceDebited && transactionId) {
        try {
          const order = orderStorage.getOrder(orderId);
          
          if (order && balanceService && order.user_id === interaction.user.id) {
            const refundTransactionId = `refund_${transactionId}`;
            await balanceService.refundUserBalance(
              interaction.user.id,
              order.price,
              refundTransactionId,
              `Reembolso - Erro inesperado: ${error.message || 'Erro desconhecido'}`
            );
            
            logger.info(`Saldo reembolsado após erro inesperado: ${orderId} para usuário ${interaction.user.id}`);
            
            await interaction.editReply({
              content: `❌ **Erro ao processar compra**\n\n` +
                       `Ocorreu um erro inesperado durante o processamento.\n\n` +
                       `💰 **Seu saldo foi reembolsado automaticamente.**\n` +
                       `**Saldo atual:** R$ ${balanceService.getUserBalance(interaction.user.id).toFixed(2)}\n\n` +
                       `**Erro:** ${error.message || 'Erro desconhecido'}\n\n` +
                       `Se o problema persistir, entre em contato com um administrador.`,
            });
            return;
          }
        } catch (refundError) {
          logger.error('Erro ao reembolsar após falha na compra', refundError);
        }
      }

      await interaction.editReply({
        content: `❌ **Erro ao processar compra**\n\n` +
                 `Ocorreu um erro inesperado. ${balanceDebited ? 'Seu saldo foi debitado mas não foi possível processar a compra. Entre em contato com um administrador para reembolso.' : 'O saldo não foi debitado.'}\n\n` +
                 `**Erro:** ${error.message || 'Erro desconhecido'}`,
      });
    }
    return;
  }

  if (customId.startsWith('confirm_payment_')) {
    const orderId = customId.replace('confirm_payment_', '');
    const paymentProof = interaction.fields.getTextInputValue('payment_proof');

    await interaction.deferReply({ ephemeral: true });

    try {

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

