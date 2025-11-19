import { userBalancesStorage } from '../storage/userBalances';
import { pixTransactionsStorage } from '../storage/pixTransactions';
import { EfiService } from './efiService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class BalanceService {
  constructor(private efiService: EfiService) {}

  async createPixTransaction(
    userId: string,
    amount: number
  ): Promise<{
    success: boolean;
    transactionId?: string;
    qrCode?: string;
    pixKey?: string;
    error?: string;
  }> {
    try {
      
      if (amount < 1) {
        return {
          success: false,
          error: 'Valor mínimo é R$ 1,00',
        };
      }

      const transactionId = `pix_${uuidv4()}`;

      const charge = await this.efiService.createCharge({
        txid: transactionId,
        valor: amount,
        solicitacaoPagador: `Adição de saldo - Usuário ${userId}`,
      });

      let qrCodeData;
      try {
        qrCodeData = await this.efiService.generateQRCode(charge.location);
      } catch (qrError: any) {
        logger.error('Erro ao gerar QR Code após criar cobrança', qrError);
        
        throw new Error(`Cobrança criada com sucesso, mas falhou ao gerar QR Code: ${qrError.message || qrError}`);
      }

      const pixKey = charge.chave || process.env.EFI_PIX_KEY || 'Chave PIX não configurada';

      await pixTransactionsStorage.createTransaction({
        transaction_id: transactionId,
        user_id: userId,
        amount,
        qr_code: qrCodeData.qrcode,
        pix_key: pixKey,
        status: 'pending',
        efi_charge_id: charge.txid,
        efi_location_id: charge.location.toString(),
        efi_txid: charge.txid,
      });

      logger.info(`Transação PIX criada: ${transactionId} para usuário ${userId} - R$ ${amount.toFixed(2)}`);

      return {
        success: true,
        transactionId,
        qrCode: qrCodeData.qrcode,
        pixKey,
      };
    } catch (error: any) {
      logger.error('Erro ao criar transação PIX', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar transação PIX',
      };
    }
  }

  async confirmPixPayment(
    transactionId: string,
    efiTxid?: string
  ): Promise<{
    success: boolean;
    userId?: string;
    amount?: number;
    error?: string;
  }> {
    try {
      
      let transaction = pixTransactionsStorage.getTransaction(transactionId);

      if (!transaction && efiTxid) {
        transaction = pixTransactionsStorage.getTransactionByEfiTxid(efiTxid);
      }

      if (!transaction) {
        return {
          success: false,
          error: 'Transação não encontrada',
        };
      }

      if (transaction.status !== 'pending') {
        return {
          success: false,
          error: `Transação já foi processada (status: ${transaction.status})`,
        };
      }

      await pixTransactionsStorage.updateTransactionStatus(transaction.transaction_id, 'paid');

      await userBalancesStorage.addBalance(
        transaction.user_id,
        transaction.amount,
        transaction.transaction_id,
        'Adição de saldo via PIX'
      );

      logger.info(`Pagamento PIX confirmado: ${transaction.transaction_id} - R$ ${transaction.amount.toFixed(2)} para usuário ${transaction.user_id}`);

      return {
        success: true,
        userId: transaction.user_id,
        amount: transaction.amount,
      };
    } catch (error: any) {
      logger.error('Erro ao confirmar pagamento PIX', error);
      return {
        success: false,
        error: error.message || 'Erro ao confirmar pagamento',
      };
    }
  }

  getUserBalance(userId: string): number {
    return userBalancesStorage.getBalance(userId);
  }

  hasSufficientBalance(userId: string, amount: number): boolean {
    const balance = this.getUserBalance(userId);
    return balance >= amount;
  }

  async debitUserBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string
  ): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    const result = await userBalancesStorage.debitBalance(userId, amount, transactionId, description);
    return result;
  }

  async refundUserBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string = 'Reembolso'
  ): Promise<void> {
    await userBalancesStorage.refundBalance(userId, amount, transactionId, description);
    logger.info(`Reembolso realizado: ${userId} +R$ ${amount.toFixed(2)}`);
  }
}

