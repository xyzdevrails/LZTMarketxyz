import { promises as fs } from 'fs';
import path from 'path';
import { LZTOrder } from '../types/lzt';
import { logger } from '../utils/logger';

const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

/**
 * Sistema de storage de pedidos usando JSON file
 */
export class OrderStorage {
  private orders: Map<string, LZTOrder> = new Map();

  constructor() {
    this.loadOrders();
  }

  /**
   * Carrega pedidos do arquivo JSON
   */
  private async loadOrders(): Promise<void> {
    try {
      const data = await fs.readFile(ORDERS_FILE, 'utf-8');
      const ordersArray: LZTOrder[] = JSON.parse(data);
      
      this.orders.clear();
      ordersArray.forEach(order => {
        this.orders.set(order.order_id, order);
      });

      logger.info(`Carregados ${this.orders.size} pedidos do storage`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe ainda, criar vazio
        await this.saveOrders();
        logger.info('Arquivo de pedidos criado');
      } else {
        logger.error('Erro ao carregar pedidos', error);
      }
    }
  }

  /**
   * Salva pedidos no arquivo JSON
   */
  private async saveOrders(): Promise<void> {
    try {
      const ordersArray = Array.from(this.orders.values());
      await fs.writeFile(ORDERS_FILE, JSON.stringify(ordersArray, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Erro ao salvar pedidos', error);
      throw error;
    }
  }

  /**
   * Cria um novo pedido
   */
  async createOrder(order: Omit<LZTOrder, 'created_at'>): Promise<LZTOrder> {
    const newOrder: LZTOrder = {
      ...order,
      created_at: new Date().toISOString(),
    };

    this.orders.set(newOrder.order_id, newOrder);
    await this.saveOrders();

    logger.info(`Pedido criado: ${newOrder.order_id}`);
    return newOrder;
  }

  /**
   * Atualiza status de um pedido
   */
  async updateOrderStatus(orderId: string, status: LZTOrder['status']): Promise<LZTOrder | null> {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    const updatedOrder: LZTOrder = {
      ...order,
      status,
    };

    if (status === 'confirmed' && !updatedOrder.confirmed_at) {
      updatedOrder.confirmed_at = new Date().toISOString();
    }

    if (status === 'completed' && !updatedOrder.completed_at) {
      updatedOrder.completed_at = new Date().toISOString();
    }

    this.orders.set(orderId, updatedOrder);
    await this.saveOrders();

    logger.info(`Pedido ${orderId} atualizado para status: ${status}`);
    return updatedOrder;
  }

  /**
   * Busca um pedido por ID
   */
  getOrder(orderId: string): LZTOrder | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Busca pedidos pendentes de um usuário
   */
  getPendingOrdersByUser(userId: string): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.user_id === userId && order.status === 'pending'
    );
  }

  /**
   * Busca todos os pedidos pendentes
   */
  getAllPendingOrders(): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === 'pending'
    );
  }

  /**
   * Busca pedidos por status
   */
  getOrdersByStatus(status: LZTOrder['status']): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === status
    );
  }
}

export const orderStorage = new OrderStorage();

