import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { lztRateLimiter } from '../utils/rateLimiter';
import { handleLZTError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { ImageUploadService } from './imageUploadService';
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
  private imageUploadService: ImageUploadService;

  constructor(token: string, baseURL: string = 'https://prod-api.lzt.market') {
    this.token = token;
    this.baseURL = baseURL;
    this.imageUploadService = new ImageUploadService();

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

  async getAccountImages(itemId: number, type?: 'weapons' | 'agents' | 'buddies'): Promise<{ image?: string; images?: string[] }> {
    logger.info(`Buscando imagem da conta ${itemId}${type ? ` (tipo: ${type})` : ' (sem tipo)'}`);

    try {
      // Tentar primeiro sem parâmetro type, depois com type se fornecido
      const params: any = {};
      if (type) {
        params.type = type;
      }
      
      // O endpoint /image pode retornar uma única URL de imagem ou um objeto com image/images
      const response = await this.request<any>({
        method: 'GET',
        url: `/${itemId}/image`,
        params: Object.keys(params).length > 0 ? params : undefined,
      });

      logger.info(`[DEBUG] Resposta do endpoint /image:`, JSON.stringify(response.body, null, 2));

      // Verificar diferentes formatos de resposta possíveis
      
      // Se retornar array com string JSON contendo base64
      if (Array.isArray(response.body) && response.body.length > 0) {
        try {
          const firstItem = response.body[0];
          let parsedItem: any;
          
          // Se for string JSON, fazer parse
          if (typeof firstItem === 'string') {
            parsedItem = JSON.parse(firstItem);
          } else {
            parsedItem = firstItem;
          }
          
          // Verificar se tem base64
          if (parsedItem.base64) {
            // Converter Base64 para URL HTTP usando serviço de upload
            logger.info(`[DEBUG] Tentando fazer upload do Base64 para obter URL HTTP...`);
            const httpUrl = await this.imageUploadService.convertBase64ToUrl(parsedItem.base64);
            if (httpUrl) {
              logger.info(`[DEBUG] ✅ Imagem Base64 convertida para URL HTTP: ${httpUrl.substring(0, 50)}...`);
              return { image: httpUrl };
            } else {
              logger.warn(`[DEBUG] ⚠️ Não foi possível converter Base64 para URL HTTP`);
            }
          }
          
          // Se tiver campo image ou url
          if (parsedItem.image) {
            return { image: parsedItem.image };
          }
          if (parsedItem.url) {
            return { image: parsedItem.url };
          }
        } catch (parseError: any) {
          logger.warn(`[DEBUG] Erro ao fazer parse da resposta do array:`, parseError.message);
        }
      }
      
      // Se retornar string direta (URL ou Base64)
      if (typeof response.body === 'string') {
        // Verificar se é Base64 (começa com iVBORw0KGgo...)
        if (response.body.startsWith('iVBORw0KGgo') || response.body.length > 1000) {
          logger.info(`[DEBUG] String Base64 detectada, tentando converter para URL HTTP...`);
          const httpUrl = await this.imageUploadService.convertBase64ToUrl(response.body);
          if (httpUrl) {
            logger.info(`[DEBUG] ✅ String Base64 convertida para URL HTTP`);
            return { image: httpUrl };
          }
        }
        // Se for URL direta
        return { image: response.body };
      }
      
      // Se retornar objeto com campo 'image'
      if (response.body?.image) {
        // Verificar se image é Base64
        if (typeof response.body.image === 'string' && (response.body.image.startsWith('iVBORw0KGgo') || response.body.image.length > 1000)) {
          logger.info(`[DEBUG] Campo image contém Base64, tentando converter para URL HTTP...`);
          const httpUrl = await this.imageUploadService.convertBase64ToUrl(response.body.image);
          if (httpUrl) {
            logger.info(`[DEBUG] ✅ Campo image Base64 convertido para URL HTTP`);
            return { image: httpUrl };
          }
        }
        return { image: response.body.image };
      }
      
      // Se retornar objeto com campo 'base64'
      if (response.body?.base64) {
        logger.info(`[DEBUG] Campo base64 encontrado, tentando converter para URL HTTP...`);
        const httpUrl = await this.imageUploadService.convertBase64ToUrl(response.body.base64);
        if (httpUrl) {
          logger.info(`[DEBUG] ✅ Campo base64 convertido para URL HTTP`);
          return { image: httpUrl };
        }
      }
      
      // Se retornar array de imagens
      if (response.body?.images && Array.isArray(response.body.images)) {
        return { images: response.body.images };
      }
      
      // Se retornar objeto com campo 'url'
      if (response.body?.url) {
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

