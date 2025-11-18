import { promises as fs } from 'fs';
import path from 'path';
import { LZTOrder } from '../types/lzt';
import { logger } from '../utils/logger';

const ORDERS_FILE = path.join(process.cwd(), 'orders.json');

export class OrderStorage {
  private orders: Map<string, LZTOrder> = new Map();

  constructor() {
    this.loadOrders();
  }

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
        await this.saveOrders();
        logger.info('Arquivo de pedidos criado');
      } else {
        logger.error('Erro ao carregar pedidos', error);
      }
    }
  }

  private async saveOrders(): Promise<void> {
    try {
      const ordersArray = Array.from(this.orders.values());
      await fs.writeFile(ORDERS_FILE, JSON.stringify(ordersArray, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Erro ao salvar pedidos', error);
      throw error;
    }
  }

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

  getOrder(orderId: string): LZTOrder | null {
    return this.orders.get(orderId) || null;
  }

  getPendingOrdersByUser(userId: string): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.user_id === userId && order.status === 'pending'
    );
  }

  getAllPendingOrders(): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === 'pending'
    );
  }

  getOrdersByStatus(status: LZTOrder['status']): LZTOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === status
    );
  }
}

export const orderStorage = new OrderStorage();

