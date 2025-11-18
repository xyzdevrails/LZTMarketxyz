import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { lztRateLimiter } from '../utils/rateLimiter';
import { handleLZTError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import {
  LZTAccount,
  LZTSearchFilters,
  LZTSearchResponse,
  LZTPurchaseResponse,
  LZTResponse,
} from '../types/lzt';

export class LZTService {
  private client: AxiosInstance;
  private baseURL: string;
  private token: string;

  constructor(token: string, baseURL: string = 'https://prod-api.lzt.market') {
    this.token = token;
    this.baseURL = baseURL;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<LZTResponse<T>> {
    try {
      const response = await lztRateLimiter.schedule(() => this.client.request<T>(config));
      
      return {
        status_code: response.status,
        body: response.data,
      };
    } catch (error: any) {
      throw handleLZTError(error);
    }
  }

  async listValorantAccounts(filters?: LZTSearchFilters): Promise<LZTSearchResponse> {
    logger.info('Buscando contas de Valorant', filters);

    const params: Record<string, any> = {};

    if (filters?.price_min) params.pmin = filters.price_min;
    if (filters?.price_max) params.pmax = filters.price_max;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.perPage = filters.per_page;
    if (filters?.title) params.title = filters.title;
    if (filters?.order_by) params.order_by = filters.order_by;
    if (filters?.rmin) params.rmin = filters.rmin;
    if (filters?.rmax) params.rmax = filters.rmax;

    const response = await this.request<LZTSearchResponse>({
      method: 'GET',
      url: '/riot',
      params,
    });

    const result = response.body;

    if (result && !result.pagination) {
      result.pagination = {
        current_page: result.page || 1,
        per_page: result.perPage || 40,
        total: result.totalItems || 0,
        total_pages: result.hasNextPage ? (result.page || 1) + 1 : (result.page || 1),
      };
    }

    return result;
  }

  async getAccountDetails(itemId: number): Promise<LZTAccount> {
    logger.info(`Buscando detalhes da conta ${itemId}`);

    const response = await this.request<LZTAccount>({
      method: 'GET',
      url: `/market/${itemId}`,
    });

    return response.body;
  }

  async bulkGetAccounts(itemIds: number[]): Promise<LZTAccount[]> {
    logger.info(`Buscando ${itemIds.length} contas em bulk`);

    const response = await this.request<{ items: LZTAccount[] }>({
      method: 'POST',
      url: '/market/bulk-get',
      data: {
        item_ids: itemIds,
      },
    });

    return response.body.items || [];
  }

  async checkAccount(itemId: number): Promise<{ available: boolean; message?: string }> {
    logger.info(`Verificando disponibilidade da conta ${itemId}`);

    try {
      const response = await this.request<{ available: boolean; message?: string }>({
        method: 'POST',
        url: `/market/${itemId}/check`,
      });

      return response.body;
    } catch (error: any) {
      if (error.statusCode === 400) {
        return { available: false, message: 'Conta não disponível para compra' };
      }
      throw error;
    }
  }

  async fastBuyAccount(itemId: number, price?: number): Promise<LZTPurchaseResponse> {
    logger.info(`Comprando conta ${itemId}${price ? ` por ${price}` : ''}`);

    const data: any = {};
    if (price) {
      data.price = price;
    }

    const response = await this.request<LZTPurchaseResponse>({
      method: 'POST',
      url: `/market/${itemId}/fast-buy`,
      data,
    });

    return response.body;
  }

  async confirmBuy(itemId: number, price?: number): Promise<LZTPurchaseResponse> {
    logger.info(`Confirmando compra da conta ${itemId}${price ? ` por ${price}` : ''}`);

    const data: any = {};
    if (price) {
      data.price = price;
    }

    const response = await this.request<LZTPurchaseResponse>({
      method: 'POST',
      url: `/market/${itemId}/confirm-buy`,
      data,
    });

    return response.body;
  }
}

