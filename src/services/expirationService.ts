import { Client } from 'discord.js';
import { pixTransactionsStorage, PixTransaction } from '../storage/pixTransactions';
import { logger } from '../utils/logger';

export class ExpirationService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
  private readonly EXPIRATION_HOURS = 1; // 1 hora

  constructor(private discordClient: Client) {}

  /**
   * Inicia o serviço de verificação de expiração
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('[EXPIRATION] Serviço de expiração já está rodando');
      return;
    }

    logger.info(`[EXPIRATION] Iniciando serviço de verificação de expiração (intervalo: ${this.CHECK_INTERVAL_MS / 1000 / 60} minutos)`);
    
    // Executa imediatamente na primeira vez
    this.checkAndExpireTransactions();

    // Depois executa periodicamente
    this.intervalId = setInterval(() => {
      this.checkAndExpireTransactions();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Para o serviço de verificação de expiração
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[EXPIRATION] Serviço de expiração parado');
    }
  }

  /**
   * Verifica e expira transações pendentes antigas
   */
  private async checkAndExpireTransactions(): Promise<void> {
    try {
      logger.info('[EXPIRATION] Verificando transações pendentes expiradas...');

      const expiredTransactions = pixTransactionsStorage.getExpiredPendingTransactions(this.EXPIRATION_HOURS);

      if (expiredTransactions.length === 0) {
        logger.info('[EXPIRATION] Nenhuma transação expirada encontrada');
        return;
      }

      logger.info(`[EXPIRATION] Encontradas ${expiredTransactions.length} transação(ões) expirada(s)`);

      for (const transaction of expiredTransactions) {
        try {
          // Marca a transação como expirada
          await pixTransactionsStorage.updateTransactionStatus(
            transaction.transaction_id,
            'expired',
            {
              expired_at: new Date().toISOString(),
            }
          );

          logger.info(`[EXPIRATION] Transação ${transaction.transaction_id} marcada como expirada`);

          // Envia DM ao usuário
          await this.notifyUserExpiration(transaction);
        } catch (error: any) {
          logger.error(`[EXPIRATION] Erro ao processar transação ${transaction.transaction_id}:`, error);
        }
      }

      // Limpa transações muito antigas (mais de 7 dias expiradas) - apenas uma vez por ciclo
      await this.cleanupOldTransactions();

      logger.info(`[EXPIRATION] Processamento concluído. ${expiredTransactions.length} transação(ões) expirada(s)`);
    } catch (error: any) {
      logger.error('[EXPIRATION] Erro ao verificar transações expiradas:', error);
    }
  }

  /**
   * Notifica o usuário sobre a expiração da transação
   */
  private async notifyUserExpiration(transaction: PixTransaction): Promise<void> {
    try {
      const user = await this.discordClient.users.fetch(transaction.user_id);

      const message = `⏰ **Transação PIX Expirada**\n\n` +
        `**ID da Transação:** \`${transaction.transaction_id}\`\n` +
        `**Valor:** R$ ${transaction.amount.toFixed(2)}\n` +
        `**Criada em:** ${new Date(transaction.created_at).toLocaleString('pt-BR')}\n\n` +
        `Esta transação PIX expirou após 1 hora sem pagamento.\n\n` +
        `💡 **Deseja tentar novamente?** Use o comando \`/adicionarsaldo\` para gerar um novo QR Code PIX.\n\n` +
        `Se você já realizou o pagamento, entre em contato com um administrador.`;

      await user.send(message);
      logger.info(`[EXPIRATION] DM de expiração enviada ao usuário ${transaction.user_id} para transação ${transaction.transaction_id}`);
    } catch (error: any) {
      logger.warn(`[EXPIRATION] Não foi possível enviar DM de expiração ao usuário ${transaction.user_id}:`, error.message);
    }
  }

  /**
   * Remove transações expiradas há mais de 7 dias
   */
  private async cleanupOldTransactions(): Promise<void> {
    try {
      const allTransactions = pixTransactionsStorage.getAllTransactions();
      const now = new Date();
      const sevenDaysAgo = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

      const oldExpiredTransactions = allTransactions.filter(transaction => {
        if (transaction.status !== 'expired' || !transaction.expired_at) {
          return false;
        }

        const expiredAt = new Date(transaction.expired_at);
        const timeDiff = now.getTime() - expiredAt.getTime();

        return timeDiff > sevenDaysAgo;
      });

      if (oldExpiredTransactions.length === 0) {
        return;
      }

      logger.info(`[EXPIRATION] Limpando ${oldExpiredTransactions.length} transação(ões) expirada(s) antiga(s) (>7 dias)`);

      // Nota: Por enquanto, apenas logamos. Se necessário, podemos implementar
      // uma função de remoção no storage, mas geralmente é melhor manter histórico
      // para auditoria. Se o arquivo ficar muito grande, podemos considerar
      // arquivamento ou limpeza seletiva.
      
      logger.info(`[EXPIRATION] Transações antigas mantidas para histórico (total: ${oldExpiredTransactions.length})`);
    } catch (error: any) {
      logger.error('[EXPIRATION] Erro ao limpar transações antigas:', error);
    }
  }
}

