import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { BalanceService } from '../services/balanceService';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

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

    // Remove espaços e converte vírgula para ponto
    const valorLimpo = valorString.trim().replace(',', '.');
    
    // Verifica se tem zeros à esquerda (ex: 0001, 000001, 0000)
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
    
    // Verifica se é um número válido
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
    
    // Valida valor mínimo
    if (valor < 1) {
      await interaction.editReply({
        content: '❌ **Valor mínimo é R$ 1,00**\n\n' +
          `Você informou: R$ ${valor.toFixed(2)}\n\n` +
          'Por favor, informe um valor igual ou maior que R$ 1,00.',
      });
      return;
    }
    
    // Valida se o valor é positivo
    if (valor <= 0) {
      await interaction.editReply({
        content: '❌ **Valor inválido!**\n\n' +
          'Por favor, informe um valor maior que zero.\n' +
          '✅ Exemplos: `1`, `10`, `50`, `100`',
      });
      return;
    }

    // Cria transação PIX
    let result;
    try {
      result = await balanceService.createPixTransaction(userId, valor);
    } catch (error: any) {
      logger.error('Erro ao criar transação PIX', error);
      
      // Verifica se é erro de certificado
      if (error.message?.includes('Certificado não encontrado') || error.message?.includes('.p12')) {
        await interaction.editReply({
          content: `❌ **Certificado não configurado**\n\n` +
            `Para usar o comando /adicionarsaldo, é necessário:\n` +
            `1. Baixar o certificado .p12 da EfiBank\n` +
            `2. Colocar em \`certs/certificado.p12\`\n` +
            `3. Configurar no Railway: \`EFI_CERTIFICATE_PATH=./certs/certificado.p12\`\n\n` +
            `📖 Consulte a documentação da EfiBank para obter o certificado.`,
        });
        return;
      }
      
      await interaction.editReply({
        content: `❌ Erro ao criar transação PIX: ${error.message || 'Erro desconhecido'}`,
      });
      return;
    }

    if (!result.success || !result.qrCode || !result.transactionId) {
      await interaction.editReply({
        content: `❌ Erro ao criar transação PIX: ${result.error || 'Erro desconhecido'}`,
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
    logger.error('Erro ao processar comando /adicionarsaldo', error);
    await interaction.editReply({
      content: `❌ Erro ao processar: ${error.message || 'Erro desconhecido'}`,
    });
  }
}

