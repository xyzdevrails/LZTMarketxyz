import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { BalanceService } from '../services/balanceService';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const data = new SlashCommandBuilder()
  .setName('adicionarsaldo')
  .setDescription('Adiciona saldo à sua conta via PIX')
  .addStringOption(option =>
    option
      .setName('valor')
      .setDescription('Valor em reais para adicionar (mínimo: R$ 1,00). Exemplo: 1, 10, 50, 100')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  balanceService: BalanceService
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    const valorString = interaction.options.getString('valor', true);
    const userId = interaction.user.id;

    const valorLimpo = valorString.trim().replace(',', '.');

    if (valorLimpo.match(/^0+[1-9]/) || valorLimpo.match(/^0+0+$/)) {
      await interaction.editReply({
        content: '❌ **Formato inválido!**\n\n' +
          `Você digitou: \`${valorString}\`\n\n` +
          '✅ **Use o formato correto:**\n' +
          '• `1` ou `1.00` para R$ 1,00\n' +
          '• `10` ou `10.00` para R$ 10,00\n' +
          '• `100` ou `100.00` para R$ 100,00\n\n' +
          '⚠️ **Não use zeros à esquerda** (ex: 0001, 000001)',
      });
      return;
    }

    const valor = parseFloat(valorLimpo);
    
    if (isNaN(valor)) {
      await interaction.editReply({
        content: '❌ **Valor inválido!**\n\n' +
          `Você digitou: \`${valorString}\`\n\n` +
          'Por favor, informe um número válido.\n' +
          '✅ Exemplos: `1`, `10`, `50`, `100`, `1.50`, `10.99`',
      });
      return;
    }

    if (valor < 1) {
      await interaction.editReply({
        content: '❌ **Valor mínimo é R$ 1,00**\n\n' +
          `Você informou: R$ ${valor.toFixed(2)}\n\n` +
          'Por favor, informe um valor igual ou maior que R$ 1,00.',
      });
      return;
    }

    if (valor <= 0) {
      await interaction.editReply({
        content: '❌ **Valor inválido!**\n\n' +
          'Por favor, informe um valor maior que zero.\n' +
          '✅ Exemplos: `1`, `10`, `50`, `100`',
      });
      return;
    }

    const confirmationId = uuidv4();

    const confirmEmbed = new EmbedBuilder()
      .setTitle('💰 Confirmar Adição de Saldo')
      .setColor(0xffaa00)
      .setDescription(
        `**Valor a ser adicionado:** R$ ${valor.toFixed(2)}\n\n` +
        `⚠️ **Confirme se o valor está correto antes de gerar o QR Code PIX.**\n\n` +
        `Após confirmar, você receberá:\n` +
        `• QR Code para pagamento\n` +
        `• Chave PIX para copiar e colar\n` +
        `• ID da transação para acompanhamento\n\n` +
        `⏰ O QR Code expira em 1 hora após a geração.`
      )
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_add_balance_${userId}_${valor}_${confirmationId}`)
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cancel_add_balance_${confirmationId}`)
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      embeds: [confirmEmbed],
      components: [row],
    });

    logger.info(`Confirmação de saldo solicitada por ${interaction.user.tag} (${userId}): R$ ${valor.toFixed(2)}`);
  } catch (error: any) {
    logger.error('Erro ao processar comando /adicionarsaldo', error);
    await interaction.editReply({
      content: `❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`,
    });
  }
}

