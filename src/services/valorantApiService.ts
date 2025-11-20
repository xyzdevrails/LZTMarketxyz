import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

/**
 * Serviço para buscar imagens de skins do Valorant através da API valorant-api.com
 * Esta API é não-oficial mas fornece dados atualizados sobre o jogo
 * 
 * Documentação: https://dash.valorant-api.com/
 */
export class ValorantApiService {
  private client: AxiosInstance;
  private baseURL: string = 'https://valorant-api.com/v1';
  private skinCache: Map<string, any> = new Map(); // Cache de skins para evitar múltiplas requisições

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Busca todas as skins de armas disponíveis na API
   * Retorna um mapa com nome da skin -> dados da skin (incluindo imagens)
   */
  async getAllWeaponSkins(): Promise<Map<string, any>> {
    try {
      logger.info('[ValorantAPI] Buscando todas as skins de armas...');
      
      const response = await this.client.get('/weapons/skins');
      
      if (response.data?.status === 200 && response.data?.data) {
        const skins = response.data.data;
        const skinMap = new Map<string, any>();
        
        // Criar mapa: nome da skin -> dados completos
        for (const skin of skins) {
          if (skin.displayName && skin.displayIcon) {
            // Normalizar nome para busca (lowercase, remover caracteres especiais)
            const normalizedName = this.normalizeSkinName(skin.displayName);
            skinMap.set(normalizedName, {
              name: skin.displayName,
              image: skin.displayIcon,
              wideImage: skin.wideIcon || skin.displayIcon,
              fullImage: skin.fullRender || skin.displayIcon,
              uuid: skin.uuid,
              themeUuid: skin.themeUuid,
            });
          }
        }
        
        logger.info(`[ValorantAPI] ${skinMap.size} skins carregadas com sucesso`);
        this.skinCache = skinMap;
        return skinMap;
      }
      
      logger.warn('[ValorantAPI] Resposta inválida da API');
      return new Map();
    } catch (error: any) {
      logger.error('[ValorantAPI] Erro ao buscar skins:', error.message);
      return new Map();
    }
  }

  /**
   * Busca imagem de uma skin específica pelo nome
   * Tenta fazer match aproximado do nome da skin
   */
  async getSkinImage(skinName: string): Promise<string | null> {
    try {
      // Se o cache estiver vazio, carregar todas as skins primeiro
      if (this.skinCache.size === 0) {
        await this.getAllWeaponSkins();
      }

      // Normalizar nome da skin para busca
      const normalizedSearchName = this.normalizeSkinName(skinName);
      
      // Tentar match exato primeiro
      let foundSkin = this.skinCache.get(normalizedSearchName);
      
      if (foundSkin) {
        logger.info(`[ValorantAPI] Match exato encontrado para "${skinName}"`);
        return foundSkin.image || foundSkin.wideImage || foundSkin.fullImage || null;
      }

      // Tentar match parcial (buscar se o nome contém parte da skin)
      for (const [cachedName, skinData] of this.skinCache.entries()) {
        if (cachedName.includes(normalizedSearchName) || normalizedSearchName.includes(cachedName)) {
          logger.info(`[ValorantAPI] Match parcial encontrado: "${skinName}" -> "${skinData.name}"`);
          return skinData.image || skinData.wideImage || skinData.fullImage || null;
        }
      }

      // Tentar buscar por palavras-chave comuns
      const keywords = this.extractKeywords(skinName);
      for (const keyword of keywords) {
        for (const [cachedName, skinData] of this.skinCache.entries()) {
          if (cachedName.includes(keyword) && keyword.length > 3) {
            logger.info(`[ValorantAPI] Match por palavra-chave: "${skinName}" -> "${skinData.name}"`);
            return skinData.image || skinData.wideImage || skinData.fullImage || null;
          }
        }
      }

      logger.warn(`[ValorantAPI] Nenhuma imagem encontrada para skin: "${skinName}"`);
      return null;
    } catch (error: any) {
      logger.error(`[ValorantAPI] Erro ao buscar imagem da skin "${skinName}":`, error.message);
      return null;
    }
  }

  /**
   * Busca imagens para múltiplas skins de uma vez
   * Retorna um mapa: nome da skin -> URL da imagem
   */
  async getMultipleSkinImages(skinNames: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Carregar cache se necessário
    if (this.skinCache.size === 0) {
      await this.getAllWeaponSkins();
    }

    for (const skinName of skinNames) {
      const imageUrl = await this.getSkinImage(skinName);
      if (imageUrl) {
        results.set(skinName, imageUrl);
      }
    }

    return results;
  }

  /**
   * Normaliza o nome da skin para facilitar busca
   * Remove acentos, caracteres especiais, converte para lowercase
   */
  private normalizeSkinName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Extrai palavras-chave relevantes do nome da skin
   */
  private extractKeywords(name: string): string[] {
    const normalized = this.normalizeSkinName(name);
    const words = normalized.split(' ').filter(word => word.length > 2);
    
    // Remover palavras muito comuns
    const commonWords = ['skin', 'weapon', 'gun', 'rifle', 'pistol', 'knife', 'melee'];
    return words.filter(word => !commonWords.includes(word));
  }

  /**
   * Limpa o cache de skins
   */
  clearCache(): void {
    this.skinCache.clear();
    logger.info('[ValorantAPI] Cache de skins limpo');
  }
}

