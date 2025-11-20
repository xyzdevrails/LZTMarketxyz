import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface PublishedAccount {
  item_id: number;
  published_at: string;
  channel_id: string;
  message_id?: string;
}

const STORAGE_FILE = path.join(__dirname, '../../published_accounts.json');

class PublishedAccountsStorage {
  private accounts: Map<number, PublishedAccount> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const accountsArray: PublishedAccount[] = JSON.parse(data);
        this.accounts = new Map(accountsArray.map(acc => [acc.item_id, acc]));
        logger.info(`Carregadas ${this.accounts.size} contas já publicadas`);
      } else {
        logger.info('Arquivo de contas publicadas não existe, criando novo');
        this.save();
      }
    } catch (error: any) {
      logger.error('Erro ao carregar contas publicadas', error);
      this.accounts = new Map();
    }
  }

  private save(): void {
    try {
      const accountsArray = Array.from(this.accounts.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(accountsArray, null, 2), 'utf-8');
    } catch (error: any) {
      logger.error('Erro ao salvar contas publicadas', error);
    }
  }

  isPublished(itemId: number): boolean {
    return this.accounts.has(itemId);
  }

  markAsPublished(itemId: number, channelId: string, messageId?: string): void {
    this.accounts.set(itemId, {
      item_id: itemId,
      published_at: new Date().toISOString(),
      channel_id: channelId,
      message_id: messageId,
    });
    this.save();
    logger.info(`Conta ${itemId} marcada como publicada no canal ${channelId}`);
  }

  getPublishedAccounts(): PublishedAccount[] {
    return Array.from(this.accounts.values());
  }

  removePublished(itemId: number): void {
    this.accounts.delete(itemId);
    this.save();
    logger.info(`Conta ${itemId} removida da lista de publicadas`);
  }
}

export const publishedAccountsStorage = new PublishedAccountsStorage();

