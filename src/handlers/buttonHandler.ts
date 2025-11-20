import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { LZTService } from '../services/lztService';
import { PurchaseService } from '../services/purchaseService';
import { BalanceService } from '../services/balanceService';
import { createAccountEmbed } from '../utils/embedBuilder';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  lztService: LZTService,
  purchaseService: PurchaseService,
  balanceService?: BalanceService
): Promise<void> {
  const customId = interaction.customId;

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

  if (customId.startsWith('buy_account_')) {
    const itemId = parseInt(customId.replace('buy_account_', ''));

    try {
      const account = await lztService.getAccountDetails(itemId);

      if (account.is_purchased) {
        await interaction.reply({
          content: '❌ Esta conta já foi vendida.',
          ephemeral: true,
        });
        return;
      }

      // Verificar se o serviço de saldo está disponível e se o usuário tem saldo suficiente
      if (balanceService) {
        const userBalance = balanceService.getUserBalance(interaction.user.id);
        const hasBalance = balanceService.hasSufficientBalance(interaction.user.id, account.price);

        if (hasBalance) {
          // Usuário tem saldo suficiente - mostrar modal de confirmação para compra com saldo
          const order = await purchaseService.createPendingOrder(
            itemId,
            interaction.user,
            account.price,
            account.currency || 'BRL'
          );

          const modal = new ModalBuilder()
            .setCustomId(`confirm_balance_purchase_${order.order_id}`)
            .setTitle('Confirmar Compra com Saldo');

          const confirmInput = new TextInputBuilder()
            .setCustomId('confirm_text')
            .setLabel('Digite "CONFIRMAR" para prosseguir')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Digite CONFIRMAR')
            .setRequired(true)
            .setMaxLength(10);

          const row = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
          modal.addComponents(row);

          await interaction.reply({
            content: `💰 **Saldo Disponível:** R$ ${userBalance.toFixed(2)}\n` +
                     `💵 **Preço da Conta:** R$ ${account.price.toFixed(2)}\n` +
                     `✅ **Saldo Restante após compra:** R$ ${(userBalance - account.price).toFixed(2)}\n\n` +
                     `Confirme a compra no modal abaixo para prosseguir.`,
            ephemeral: true,
          });

          await interaction.showModal(modal);
          return;
        } else {
          // Usuário não tem saldo suficiente - mostrar opção de adicionar saldo ou pagar manualmente
          const order = await purchaseService.createPendingOrder(
            itemId,
            interaction.user,
            account.price,
            account.currency || 'BRL'
          );

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

          await interaction.reply({
            content: `⚠️ **Saldo Insuficiente**\n\n` +
                     `💰 **Seu Saldo:** R$ ${userBalance.toFixed(2)}\n` +
                     `💵 **Preço da Conta:** R$ ${account.price.toFixed(2)}\n` +
                     `❌ **Faltam:** R$ ${(account.price - userBalance).toFixed(2)}\n\n` +
                     `💡 Use \`/adicionarsaldo\` para adicionar saldo ou confirme o pagamento manual no modal abaixo.`,
            ephemeral: true,
          });

          await interaction.showModal(modal);
          return;
        }
      }

      // Se não há serviço de saldo disponível, usar fluxo manual
      const order = await purchaseService.createPendingOrder(
        itemId,
        interaction.user,
        account.price,
        account.currency || 'BRL'
      );

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

  if (customId.startsWith('confirm_payment_')) {
    return;
  }

  if (customId.startsWith('confirm_add_balance_')) {
    if (!balanceService) {
      await interaction.reply({
        content: '❌ **Serviço de saldo não está disponível**\n\n' +
          'Configure as credenciais da EfiBank no Railway.',
        ephemeral: true,
      });
      return;
    }

    const parts = customId.split('_');
    if (parts.length < 6) {
      await interaction.reply({
        content: '❌ Erro ao processar confirmação. Tente novamente.',
        ephemeral: true,
      });
      return;
    }

    const userId = parts[3];
    const valor = parseFloat(parts[4]);

    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: '❌ Você não pode confirmar esta transação.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      const result = await balanceService.createPixTransaction(userId, valor);

      if (!result.success || !result.qrCode || !result.transactionId) {
        await interaction.editReply({
          content: `❌ Erro ao criar transação PIX: ${result.error || 'Erro desconhecido'}`,
          components: [],
        });
        return;
      }

      let qrCodeImage: Buffer | null = null;
      try {
        qrCodeImage = await QRCode.toBuffer(result.qrCode, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      } catch (qrError) {
        logger.warn('Erro ao gerar imagem do QR Code, usando texto', qrError);
      }

      const isSandbox = process.env.EFI_SANDBOX === 'true';
      
      const embed = new EmbedBuilder()
        .setTitle('💰 Adicionar Saldo via PIX')
        .setColor(isSandbox ? 0xffaa00 : 0x00ff00)
        .setDescription(
          (isSandbox 
            ? `⚠️ **AMBIENTE DE TESTES (SANDBOX)**\n` +
              `Este QR Code é apenas para testes e **NÃO pode ser pago** com dinheiro real.\n` +
              `Para pagamentos reais, configure o ambiente de PRODUÇÃO.\n\n`
            : ''
          ) +
          `**Valor:** R$ ${valor.toFixed(2)}\n` +
          `**ID da Transação:** \`${result.transactionId}\`\n` +
          `**Status:** ⏳ Aguardando pagamento\n\n` +
          `**Chave PIX:**\n\`\`\`\n${result.pixKey}\`\`\`\n\n` +
          `📱 Escaneie o QR Code abaixo ou copie a chave PIX para pagar.\n` +
          `⏰ Esta transação expira em 1 hora.\n\n` +
          `⚠️ **Importante:** Guarde o ID da transação para referência.`
        )
        .setTimestamp();

      const responseData: any = {
        embeds: [embed],
        components: [],
      };

      if (qrCodeImage) {
        const attachment = new AttachmentBuilder(qrCodeImage, {
          name: 'qrcode.png',
          description: 'QR Code para pagamento PIX',
        });
        embed.setImage('attachment://qrcode.png');
        responseData.files = [attachment];
      } else {
        embed.addFields({
          name: 'QR Code (texto)',
          value: `\`\`\`\n${result.qrCode.substring(0, 200)}...\`\`\``,
        });
      }

      await interaction.editReply(responseData);

      logger.info(`Transação PIX criada para ${interaction.user.tag} (${userId}): R$ ${valor.toFixed(2)}`);
    } catch (error: any) {
      logger.error('Erro ao criar transação PIX após confirmação', error);
      
      if (error.message?.includes('Certificado não encontrado') || error.message?.includes('.p12')) {
        await interaction.editReply({
          content: `❌ **Certificado não configurado**\n\n` +
            `Para usar o comando /adicionarsaldo, é necessário:\n` +
            `1. Baixar o certificado .p12 da EfiBank\n` +
            `2. Colocar em \`certs/certificado.p12\`\n` +
            `3. Configurar no Railway: \`EFI_CERTIFICATE_PATH=./certs/certificado.p12\`\n\n` +
            `📖 Consulte a documentação da EfiBank para obter o certificado.`,
          components: [],
        });
        return;
      }
      
      await interaction.editReply({
        content: `❌ Erro ao criar transação PIX: ${error.message || 'Erro desconhecido'}`,
        components: [],
      });
    }
    return;
  }

  if (customId.startsWith('cancel_add_balance_')) {
    await interaction.deferUpdate();
    
    const cancelEmbed = new EmbedBuilder()
      .setTitle('❌ Operação Cancelada')
      .setColor(0xff0000)
      .setDescription('A adição de saldo foi cancelada.\n\nUse `/adicionarsaldo` novamente quando quiser adicionar saldo.')
      .setTimestamp();

    await interaction.editReply({
      embeds: [cancelEmbed],
      components: [],
    });

    logger.info(`Adição de saldo cancelada por ${interaction.user.tag} (${interaction.user.id})`);
    return;
  }

  await interaction.reply({
    content: '❌ Ação não reconhecida.',
    ephemeral: true,
  });
}

