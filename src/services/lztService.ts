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

    // Filtrar apenas contas de Valorant (game_id = 13)
    params.game_id = filters?.game_id || 13;

    if (filters?.price_min) params.pmin = filters.price_min;
    if (filters?.price_max) params.pmax = filters.price_max;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.perPage = filters.per_page;
    if (filters?.title) params.title = filters.title;
    if (filters?.order_by) params.order_by = filters.order_by;
    if (filters?.rmin) params.rmin = filters.rmin;
    if (filters?.rmax) params.rmax = filters.rmax;

    // Filtros específicos de Valorant
    if (filters?.country) {
      // A API aceita array: country[]=Bra
      params['country[]'] = Array.isArray(filters.country) ? filters.country : [filters.country];
    }
    if (filters?.valorant_region) {
      // A API aceita array: valorant_region[]=BR
      params['valorant_region[]'] = Array.isArray(filters.valorant_region) ? filters.valorant_region : [filters.valorant_region];
    }
    if (filters?.valorant_smin !== undefined) {
      params.valorant_smin = filters.valorant_smin;
    }
    if (filters?.valorant_level_min !== undefined) {
      params.valorant_level_min = filters.valorant_level_min;
    }

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

  async getAccountImages(itemId: number, type: 'skins' | 'pickaxes' | 'dances' | 'gliders' | 'weapons' | 'agents' | 'buddies' = 'skins'): Promise<{ image?: string; images?: string[] }> {
    logger.info(`Buscando imagem da conta ${itemId} (tipo: ${type})`);

    try {
      // O endpoint /image pode retornar uma única URL de imagem ou um objeto com image/images
      const response = await this.request<any>({
        method: 'GET',
        url: `/${itemId}/image`,
        params: { type },
      });

      logger.info(`[DEBUG] Resposta do endpoint /image:`, JSON.stringify(response.body, null, 2));

      // Verificar diferentes formatos de resposta possíveis
      if (typeof response.body === 'string') {
        // Se retornar uma string direta (URL)
        return { image: response.body };
      } else if (response.body?.image) {
        // Se retornar objeto com campo 'image'
        return { image: response.body.image };
      } else if (response.body?.images && Array.isArray(response.body.images)) {
        // Se retornar array de imagens
        return { images: response.body.images };
      } else if (response.body?.url) {
        // Se retornar objeto com campo 'url'
        return { image: response.body.url };
      }

      // Fallback: retornar o body inteiro como possível URL
      return { image: typeof response.body === 'string' ? response.body : undefined };
    } catch (error: any) {
      logger.error(`Erro ao buscar imagem da conta ${itemId}:`, error);
      logger.error(`[DEBUG] Detalhes do erro:`, {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });
      return {};
    }
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

