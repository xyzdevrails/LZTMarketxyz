import { User } from 'discord.js';
import { LZTService } from './lztService';
import { orderStorage } from '../storage/orders';
import { logger } from '../utils/logger';
import { LZTAccount, LZTOrder } from '../types/lzt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço de compra de contas
 */
export class PurchaseService {
  constructor(private lztService: LZTService) {}

  /**
   * Cria um pedido pendente
   */
  async createPendingOrder(
    itemId: number,
    user: User,
    price: number,
    currency: string = 'BRL'
  ): Promise<LZTOrder> {
    const orderId = uuidv4();

    const order = await orderStorage.createOrder({
      order_id: orderId,
      item_id: itemId,
      user_id: user.id,
      username: user.username,
      status: 'pending',
      price,
      currency,
    });

    logger.info(`Pedido criado: ${orderId} para usuário ${user.username} (${user.id})`);

    return order;
  }

  /**
   * Confirma pagamento e executa a compra
   */
  async confirmPurchase(orderId: string): Promise<{
    success: boolean;
    order?: LZTOrder;
    accountData?: LZTAccount['account_data'];
    error?: string;
  }> {
    const order = orderStorage.getOrder(orderId);

    if (!order) {
      return {
        success: false,
        error: 'Pedido não encontrado',
      };
    }

    if (order.status !== 'pending') {
      return {
        success: false,
        error: `Pedido já foi processado (status: ${order.status})`,
      };
    }

    try {
      // Atualiza status para confirmado
      await orderStorage.updateOrderStatus(orderId, 'confirmed');

      // Verifica disponibilidade da conta
      const checkResult = await this.lztService.checkAccount(order.item_id);

      if (!checkResult.available) {
        await orderStorage.updateOrderStatus(orderId, 'cancelled');
        return {
          success: false,
          error: checkResult.message || 'Conta não está mais disponível',
        };
      }

      // Executa a compra
      const purchaseResult = await this.lztService.fastBuyAccount(order.item_id, order.price);

      // Obtém detalhes completos da conta (incluindo credenciais)
      const accountDetails = await this.lztService.getAccountDetails(order.item_id);

      // Marca pedido como concluído
      await orderStorage.updateOrderStatus(orderId, 'completed');

      logger.info(`Compra concluída: ${orderId}`);

      return {
        success: true,
        order: orderStorage.getOrder(orderId)!,
        accountData: accountDetails.account_data || accountDetails.account_credentials,
      };
    } catch (error: any) {
      logger.error(`Erro ao processar compra ${orderId}`, error);
      
      await orderStorage.updateOrderStatus(orderId, 'cancelled');

      return {
        success: false,
        error: error.message || 'Erro ao processar compra',
      };
    }
  }

  /**
   * Cancela um pedido
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = orderStorage.getOrder(orderId);
    
    if (!order || order.status !== 'pending') {
      return false;
    }

    await orderStorage.updateOrderStatus(orderId, 'cancelled');
    logger.info(`Pedido cancelado: ${orderId}`);

    return true;
  }

  /**
   * Busca pedidos pendentes de um usuário
   */
  getPendingOrdersByUser(userId: string): LZTOrder[] {
    return orderStorage.getPendingOrdersByUser(userId);
  }
}

