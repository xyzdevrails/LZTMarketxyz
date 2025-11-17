import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const BALANCES_FILE = path.join(process.cwd(), 'user_balances.json');

export interface UserBalance {
  user_id: string;
  balance: number;
  transactions: Transaction[];
  updated_at: string;
}

export interface Transaction {
  transaction_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

/**
 * Sistema de storage de saldos de usuários usando JSON file
 */
export class UserBalancesStorage {
  private balances: Map<string, UserBalance> = new Map();

  constructor() {
    this.loadBalances();
  }

  /**
   * Carrega saldos do arquivo JSON
   */
  private async loadBalances(): Promise<void> {
    try {
      const data = await fs.readFile(BALANCES_FILE, 'utf-8');
      const balancesArray: UserBalance[] = JSON.parse(data);
      
      this.balances.clear();
      balancesArray.forEach(balance => {
        this.balances.set(balance.user_id, balance);
      });

      logger.info(`Carregados ${this.balances.size} saldos de usuários`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe ainda, criar vazio
        await this.saveBalances();
        logger.info('Arquivo de saldos criado');
      } else {
        logger.error('Erro ao carregar saldos', error);
      }
    }
  }

  /**
   * Salva saldos no arquivo JSON
   */
  private async saveBalances(): Promise<void> {
    try {
      const balancesArray = Array.from(this.balances.values());
      await fs.writeFile(BALANCES_FILE, JSON.stringify(balancesArray, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Erro ao salvar saldos', error);
      throw error;
    }
  }

  /**
   * Obtém ou cria saldo de um usuário
   */
  async getOrCreateBalance(userId: string): Promise<UserBalance> {
    let balance = this.balances.get(userId);
    
    if (!balance) {
      balance = {
        user_id: userId,
        balance: 0,
        transactions: [],
        updated_at: new Date().toISOString(),
      };
      this.balances.set(userId, balance);
      await this.saveBalances();
    }
    
    return balance;
  }

  /**
   * Obtém saldo de um usuário
   */
  getBalance(userId: string): number {
    const balance = this.balances.get(userId);
    return balance?.balance || 0;
  }

  /**
   * Adiciona saldo a um usuário
   */
  async addBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string = 'Adição de saldo'
  ): Promise<UserBalance> {
    const balance = await this.getOrCreateBalance(userId);
    
    balance.balance += amount;
    balance.transactions.push({
      transaction_id: transactionId,
      type: 'credit',
      amount,
      description,
      created_at: new Date().toISOString(),
    });
    balance.updated_at = new Date().toISOString();
    
    this.balances.set(userId, balance);
    await this.saveBalances();
    
    logger.info(`Saldo adicionado: ${userId} +R$ ${amount.toFixed(2)}`);
    return balance;
  }

  /**
   * Debita saldo de um usuário
   */
  async debitBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string = 'Débito de saldo'
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const balance = await this.getOrCreateBalance(userId);
    
    if (balance.balance < amount) {
      return {
        success: false,
        newBalance: balance.balance,
        error: 'Saldo insuficiente',
      };
    }
    
    balance.balance -= amount;
    balance.transactions.push({
      transaction_id: transactionId,
      type: 'debit',
      amount: -amount,
      description,
      created_at: new Date().toISOString(),
    });
    balance.updated_at = new Date().toISOString();
    
    this.balances.set(userId, balance);
    await this.saveBalances();
    
    logger.info(`Saldo debitado: ${userId} -R$ ${amount.toFixed(2)}`);
    return {
      success: true,
      newBalance: balance.balance,
    };
  }

  /**
   * Reembolsa saldo (adiciona de volta)
   */
  async refundBalance(
    userId: string,
    amount: number,
    transactionId: string,
    description: string = 'Reembolso'
  ): Promise<UserBalance> {
    return await this.addBalance(userId, amount, transactionId, description);
  }

  /**
   * Obtém histórico de transações de um usuário
   */
  getTransactions(userId: string, limit: number = 10): Transaction[] {
    const balance = this.balances.get(userId);
    if (!balance) return [];
    
    return balance.transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}

export const userBalancesStorage = new UserBalancesStorage();

