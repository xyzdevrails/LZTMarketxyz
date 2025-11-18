import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const PIX_TRANSACTIONS_FILE = path.join(process.cwd(), 'pix_transactions.json');

export interface PixTransaction {
  transaction_id: string;
  user_id: string;
  amount: number;
  qr_code: string;
  pix_key: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  created_at: string;
  paid_at?: string;
  expired_at?: string;
  efi_charge_id?: string;
  efi_txid?: string;
  efi_location_id?: string;
}

export class PixTransactionsStorage {
  private transactions: Map<string, PixTransaction> = new Map();

  constructor() {
    this.loadTransactions();
  }

  private async loadTransactions(): Promise<void> {
    try {
      const data = await fs.readFile(PIX_TRANSACTIONS_FILE, 'utf-8');
      const transactionsArray: PixTransaction[] = JSON.parse(data);
      
      this.transactions.clear();
      transactionsArray.forEach(transaction => {
        this.transactions.set(transaction.transaction_id, transaction);
      });

      logger.info(`Carregadas ${this.transactions.size} transações PIX`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        
        await this.saveTransactions();
        logger.info('Arquivo de transações PIX criado');
      } else {
        logger.error('Erro ao carregar transações PIX', error);
      }
    }
  }

  private async saveTransactions(): Promise<void> {
    try {
      const transactionsArray = Array.from(this.transactions.values());
      await fs.writeFile(PIX_TRANSACTIONS_FILE, JSON.stringify(transactionsArray, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Erro ao salvar transações PIX', error);
      throw error;
    }
  }

  async createTransaction(transaction: Omit<PixTransaction, 'created_at'>): Promise<PixTransaction> {
    const newTransaction: PixTransaction = {
      ...transaction,
      created_at: new Date().toISOString(),
    };

    this.transactions.set(newTransaction.transaction_id, newTransaction);
    await this.saveTransactions();

    logger.info(`Transação PIX criada: ${newTransaction.transaction_id}`);
    return newTransaction;
  }

  getTransaction(transactionId: string): PixTransaction | null {
    return this.transactions.get(transactionId) || null;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: PixTransaction['status'],
    additionalData?: Partial<PixTransaction>
  ): Promise<PixTransaction | null> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return null;
    }

    const updatedTransaction: PixTransaction = {
      ...transaction,
      status,
      ...additionalData,
    };

    if (status === 'paid' && !updatedTransaction.paid_at) {
      updatedTransaction.paid_at = new Date().toISOString();
    }

    this.transactions.set(transactionId, updatedTransaction);
    await this.saveTransactions();

    logger.info(`Transação PIX ${transactionId} atualizada para status: ${status}`);
    return updatedTransaction;
  }

  getPendingTransactionsByUser(userId: string): PixTransaction[] {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.user_id === userId && transaction.status === 'pending'
    );
  }

  getTransactionByEfiTxid(txid: string): PixTransaction | null {
    return Array.from(this.transactions.values()).find(
      transaction => transaction.efi_txid === txid
    ) || null;
  }

  getTransactionByLocationId(locationId: string): PixTransaction | null {
    return Array.from(this.transactions.values()).find(
      transaction => transaction.efi_location_id === locationId
    ) || null;
  }

  getAllTransactions(): PixTransaction[] {
    return Array.from(this.transactions.values());
  }
}

export const pixTransactionsStorage = new PixTransactionsStorage();

