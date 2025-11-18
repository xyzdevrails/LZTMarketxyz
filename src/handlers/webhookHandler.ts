import { BalanceService } from '../services/balanceService';
import { logger } from '../utils/logger';
import { Client } from 'discord.js';

/**
 * Interface para payload do webhook da EfiBank
 * Baseado na documentação: https://dev.efipay.com.br/docs/api-pix/webhooks
 */
interface EfiWebhookPayload {
  evento?: string;
  tipo?: string;
  horario?: string;
  txid?: string;
  endToEndId?: string;
  valor?: {
    original?: string;
  };
  pix?: Array<{
    endToEndId?: string;
    txid?: string;
    valor?: string;
    horario?: string;
  }>;
}

/**
 * Handler para processar webhooks da EfiBank
 */
export class WebhookHandler {
  constructor(
    private balanceService: BalanceService,
    private discordClient: Client
  ) {}

  /**
   * Processa webhook PIX da EfiBank
   */
  async processPixWebhook(payload: EfiWebhookPayload): Promise<{
    success: boolean;
    message: string;
    processed?: boolean;
  }> {
    try {
      logger.info('[WEBHOOK] Processando webhook PIX:', JSON.stringify(payload, null, 2));

      // Extrai txid do payload (pode vir em diferentes formatos)
      const txid = this.extractTxid(payload);

      if (!txid) {
        logger.warn('[WEBHOOK] Webhook recebido sem txid válido:', payload);
        return {
          success: false,
          message: 'Txid não encontrado no payload',
        };
      }

      logger.info(`[WEBHOOK] Txid extraído: ${txid}`);

      // Verifica se é evento de pagamento confirmado
      const isPaymentConfirmed = this.isPaymentConfirmed(payload);

      if (!isPaymentConfirmed) {
        logger.info('[WEBHOOK] Webhook recebido mas não é pagamento confirmado. Tipo:', payload.evento || payload.tipo);
        return {
          success: true,
          message: 'Webhook recebido mas não requer processamento',
          processed: false,
        };
      }

      // Confirma pagamento usando BalanceService
      const result = await this.balanceService.confirmPixPayment(txid, txid);

      if (!result.success) {
        logger.error(`[WEBHOOK] Erro ao confirmar pagamento ${txid}:`, result.error);
        return {
          success: false,
          message: result.error || 'Erro ao confirmar pagamento',
        };
      }

      logger.info(`[WEBHOOK] Pagamento confirmado com sucesso: ${txid} - R$ ${result.amount?.toFixed(2)}`);

      // Envia DM ao usuário
      if (result.userId) {
        await this.notifyUser(result.userId, result.amount || 0, txid);
      }

      return {
        success: true,
        message: 'Pagamento processado com sucesso',
        processed: true,
      };
    } catch (error: any) {
      logger.error('[WEBHOOK] Erro ao processar webhook:', error);
      return {
        success: false,
        message: error.message || 'Erro ao processar webhook',
      };
    }
  }

  /**
   * Extrai txid do payload (pode vir em diferentes formatos)
   */
  private extractTxid(payload: EfiWebhookPayload): string | null {
    // Formato 1: txid direto no payload
    if (payload.txid) {
      return payload.txid;
    }

    // Formato 2: txid dentro do array pix
    if (payload.pix && payload.pix.length > 0 && payload.pix[0].txid) {
      return payload.pix[0].txid;
    }

    // Formato 3: endToEndId (pode ser usado como txid em alguns casos)
    if (payload.endToEndId) {
      return payload.endToEndId;
    }

    return null;
  }

  /**
   * Verifica se o evento é de pagamento confirmado
   */
  private isPaymentConfirmed(payload: EfiWebhookPayload): boolean {
    const evento = payload.evento || payload.tipo || '';

    // Eventos que indicam pagamento confirmado
    const confirmedEvents = [
      'pix.pagamento',
      'pix.recebido',
      'pix.confirmado',
      'pix.payment',
      'pix.received',
    ];

    // Verifica se o evento está na lista de confirmados
    const isConfirmed = confirmedEvents.some(e => 
      evento.toLowerCase().includes(e.toLowerCase())
    );

    // Se não tem evento específico, mas tem pix com valor, assume que é pagamento
    if (!isConfirmed && payload.pix && payload.pix.length > 0) {
      return true;
    }

    return isConfirmed;
  }

  /**
   * Envia DM ao usuário notificando sobre saldo adicionado
   */
  private async notifyUser(userId: string, amount: number, txid: string): Promise<void> {
    try {
      const user = await this.discordClient.users.fetch(userId);
      const balance = this.balanceService.getUserBalance(userId);

      const message = `✅ **Pagamento PIX Confirmado!**\n\n` +
        `**ID da Transação:** \`${txid}\`\n` +
        `**Valor:** R$ ${amount.toFixed(2)}\n` +
        `**Seu Saldo Atual:** R$ ${balance.toFixed(2)}\n\n` +
        `Obrigado pela confiança! 💚\n\n` +
        `💡 Use \`/meusaldo\` para ver seu saldo completo.`;

      await user.send(message);
      logger.info(`[WEBHOOK] DM enviada ao usuário ${userId} sobre pagamento ${txid}`);
    } catch (error: any) {
      // Não é crítico se não conseguir enviar DM
      logger.warn(`[WEBHOOK] Não foi possível enviar DM ao usuário ${userId}:`, error.message);
    }
  }
}

