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
// Navegação de páginas removida

/**
 * Handler para botões interativos
 */
export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  lztService: LZTService,
  purchaseService: PurchaseService,
  balanceService?: BalanceService
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

  // Confirma adição de saldo via PIX
  if (customId.startsWith('confirm_add_balance_')) {
    if (!balanceService) {
      await interaction.reply({
        content: '❌ **Serviço de saldo não está disponível**\n\n' +
          'Configure as credenciais da EfiBank no Railway.',
        ephemeral: true,
      });
      return;
    }

    // Extrai dados do customId: confirm_add_balance_${userId}_${valor}_${confirmationId}
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

    // Verifica se é o usuário correto
    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: '❌ Você não pode confirmar esta transação.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      // Cria transação PIX
      const result = await balanceService.createPixTransaction(userId, valor);

      if (!result.success || !result.qrCode || !result.transactionId) {
        await interaction.editReply({
          content: `❌ Erro ao criar transação PIX: ${result.error || 'Erro desconhecido'}`,
          components: [],
        });
        return;
      }

      // Gera imagem do QR Code
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

      // Verifica se está em sandbox
      const isSandbox = process.env.EFI_SANDBOX === 'true';
      
      // Cria embed com informações
      const embed = new EmbedBuilder()
        .setTitle('💰 Adicionar Saldo via PIX')
        .setColor(isSandbox ? 0xffaa00 : 0x00ff00) // Laranja para sandbox, verde para produção
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

      // Prepara resposta com QR Code
      const responseData: any = {
        embeds: [embed],
        components: [], // Remove os botões após confirmação
      };

      // Se conseguiu gerar imagem do QR Code, anexa
      if (qrCodeImage) {
        const attachment = new AttachmentBuilder(qrCodeImage, {
          name: 'qrcode.png',
          description: 'QR Code para pagamento PIX',
        });
        embed.setImage('attachment://qrcode.png');
        responseData.files = [attachment];
      } else {
        // Se não conseguiu gerar imagem, mostra QR Code como texto
        embed.addFields({
          name: 'QR Code (texto)',
          value: `\`\`\`\n${result.qrCode.substring(0, 200)}...\`\`\``,
        });
      }

      await interaction.editReply(responseData);

      logger.info(`Transação PIX criada para ${interaction.user.tag} (${userId}): R$ ${valor.toFixed(2)}`);
    } catch (error: any) {
      logger.error('Erro ao criar transação PIX após confirmação', error);
      
      // Verifica se é erro de certificado
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

  // Cancela adição de saldo
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

