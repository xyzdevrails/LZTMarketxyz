import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface ValorantSkin {
  uuid: string;
  displayName: string;
  normalizedName: string;
  displayIcon: string;
  contentTierUuid: string | null;
  rarity: 'Select' | 'Deluxe' | 'Premium' | 'Exclusive' | 'Ultra' | 'Unknown';
}

interface ValorantSkinsCache {
  lastUpdated: string;
  skins: ValorantSkin[];
}

export class SkinsCacheService {
  private cacheFilePath: string;
  private cache: Map<string, ValorantSkin> = new Map();
  private client: AxiosInstance;
  private baseURL: string = 'https://valorant-api.com/v1';
  private readonly CACHE_EXPIRY_DAYS = 7;

  constructor() {
    // Definir caminho do cache na raiz do projeto
    this.cacheFilePath = path.join(process.cwd(), 'cache', 'valorant-skins.json');
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Normaliza o nome da skin para facilitar busca
   * Remove acentos, caracteres especiais, converte para lowercase
   */
  normalizeSkinName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Mapeia contentTierUuid para raridade
   */
  private mapContentTierToRarity(contentTierUuid: string | null): ValorantSkin['rarity'] {
    if (!contentTierUuid) return 'Unknown';
    
    // UUIDs conhecidos dos tiers de conteúdo
    const tierMap: Record<string, ValorantSkin['rarity']> = {
      '12683d76-48d7-84a3-4e09-6985794f4595': 'Select',      // Select
      '0cebb8be-46d7-c12a-d306-e99058bf26c8': 'Deluxe',      // Deluxe
      '60bca009-4182-7998-dee7-b8a6778f4f37': 'Premium',     // Premium
      'e046854e-406c-37f4-6607-19ac9be77da8': 'Exclusive',  // Exclusive
      '411e4a55-4e59-7757-41f8-3a899dfb1c93': 'Ultra',       // Ultra
    };

    return tierMap[contentTierUuid] || 'Unknown';
  }

  /**
   * Verifica se o cache precisa ser atualizado (mais de 7 dias)
   */
  shouldRefreshCache(cacheData: ValorantSkinsCache | null): boolean {
    if (!cacheData || !cacheData.lastUpdated) {
      return true;
    }

    const lastUpdated = new Date(cacheData.lastUpdated);
    const now = new Date();
    const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff >= this.CACHE_EXPIRY_DAYS;
  }

  /**
   * Garante que o diretório cache existe
   */
  private async ensureCacheDirectory(): Promise<void> {
    const cacheDir = path.dirname(this.cacheFilePath);
    try {
      await fs.access(cacheDir);
    } catch {
      await fs.mkdir(cacheDir, { recursive: true });
      logger.info(`[SkinsCache] Diretório cache criado: ${cacheDir}`);
    }
  }

  /**
   * Carrega cache do arquivo JSON
   */
  async loadValorantSkinsCache(): Promise<boolean> {
    try {
      await this.ensureCacheDirectory();
      
      // Tentar carregar cache existente
      try {
        const cacheContent = await fs.readFile(this.cacheFilePath, 'utf-8');
        const cacheData: ValorantSkinsCache = JSON.parse(cacheContent);

        // Verificar se precisa atualizar
        if (!this.shouldRefreshCache(cacheData)) {
          logger.info(`[SkinsCache] Cache carregado do arquivo (${cacheData.skins.length} skins)`);
          this.buildCacheMap(cacheData.skins);
          return true;
        } else {
          logger.info(`[SkinsCache] Cache expirado (última atualização: ${cacheData.lastUpdated}), buscando da API...`);
        }
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          logger.warn(`[SkinsCache] Erro ao ler cache: ${fileError.message}`);
        }
        logger.info('[SkinsCache] Cache não encontrado, buscando da API...');
      }

      // Buscar da API
      return await this.fetchAndCacheSkins();
    } catch (error: any) {
      logger.error(`[SkinsCache] Erro ao carregar cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Busca skins da API Valorant e salva no cache
   */
  private async fetchAndCacheSkins(): Promise<boolean> {
    try {
      logger.info('[SkinsCache] Buscando skins da API Valorant...');
      
      const response = await this.client.get('/weapons/skins');
      
      if (response.data?.status === 200 && response.data?.data) {
        const skins = response.data.data;
        const processedSkins: ValorantSkin[] = [];

        for (const skin of skins) {
          if (skin.displayName && skin.displayIcon) {
            const normalizedName = this.normalizeSkinName(skin.displayName);
            const rarity = this.mapContentTierToRarity(skin.contentTierUuid);

            processedSkins.push({
              uuid: skin.uuid,
              displayName: skin.displayName,
              normalizedName: normalizedName,
              displayIcon: skin.displayIcon,
              contentTierUuid: skin.contentTierUuid || null,
              rarity: rarity,
            });
          }
        }

        const cacheData: ValorantSkinsCache = {
          lastUpdated: new Date().toISOString(),
          skins: processedSkins,
        };

        await this.saveValorantSkinsCache(cacheData);
        this.buildCacheMap(processedSkins);

        logger.info(`[SkinsCache] ✅ ${processedSkins.length} skins carregadas e salvas no cache`);
        return true;
      } else {
        logger.error('[SkinsCache] Resposta inválida da API Valorant');
        return false;
      }
    } catch (error: any) {
      logger.error(`[SkinsCache] Erro ao buscar skins da API: ${error.message}`);
      
      // Tentar carregar cache existente mesmo que expirado
      try {
        const cacheContent = await fs.readFile(this.cacheFilePath, 'utf-8');
        const cacheData: ValorantSkinsCache = JSON.parse(cacheContent);
        this.buildCacheMap(cacheData.skins);
        logger.warn(`[SkinsCache] ⚠️ Usando cache expirado como fallback (${cacheData.skins.length} skins)`);
        return true;
      } catch (fallbackError) {
        logger.error('[SkinsCache] Não foi possível carregar cache de fallback');
        return false;
      }
    }
  }

  /**
   * Constrói mapa de cache em memória para busca rápida
   */
  private buildCacheMap(skins: ValorantSkin[]): void {
    this.cache.clear();
    for (const skin of skins) {
      // Armazenar por nome normalizado
      this.cache.set(skin.normalizedName, skin);
      
      // Também armazenar por UUID para busca alternativa
      this.cache.set(skin.uuid, skin);
    }
  }

  /**
   * Salva cache no arquivo JSON
   */
  async saveValorantSkinsCache(cacheData: ValorantSkinsCache): Promise<void> {
    try {
      await this.ensureCacheDirectory();
      await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf-8');
      logger.info(`[SkinsCache] Cache salvo em ${this.cacheFilePath}`);
    } catch (error: any) {
      logger.error(`[SkinsCache] Erro ao salvar cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca informações de uma skin específica pelo nome
   */
  getSkinInfo(skinName: string): ValorantSkin | null {
    if (this.cache.size === 0) {
      logger.warn('[SkinsCache] Cache vazio, chame loadValorantSkinsCache() primeiro');
      return null;
    }

    const normalizedSearchName = this.normalizeSkinName(skinName);

    // Tentar match exato primeiro
    let foundSkin = this.cache.get(normalizedSearchName);
    if (foundSkin) {
      return foundSkin;
    }

    // Tentar match parcial (buscar se o nome contém parte da skin)
    for (const [cachedName, skinData] of this.cache.entries()) {
      // Ignorar UUIDs no match parcial
      if (cachedName.includes('-') && cachedName.length > 30) continue;
      
      if (cachedName.includes(normalizedSearchName) || normalizedSearchName.includes(cachedName)) {
        logger.info(`[SkinsCache] Match parcial encontrado: "${skinName}" -> "${skinData.displayName}"`);
        return skinData;
      }
    }

    // Tentar buscar por palavras-chave
    const keywords = this.extractKeywords(normalizedSearchName);
    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      
      for (const [cachedName, skinData] of this.cache.entries()) {
        // Ignorar UUIDs
        if (cachedName.includes('-') && cachedName.length > 30) continue;
        
        if (cachedName.includes(keyword)) {
          logger.info(`[SkinsCache] Match por palavra-chave: "${skinName}" -> "${skinData.displayName}"`);
          return skinData;
        }
      }
    }

    logger.warn(`[SkinsCache] Nenhuma skin encontrada para: "${skinName}"`);
    return null;
  }

  /**
   * Extrai palavras-chave relevantes do nome da skin
   */
  private extractKeywords(name: string): string[] {
    const words = name.split(' ').filter(word => word.length > 2);
    
    // Remover palavras muito comuns
    const commonWords = ['skin', 'weapon', 'gun', 'rifle', 'pistol', 'knife', 'melee', 'vandal', 'phantom', 'operator'];
    return words.filter(word => !commonWords.includes(word));
  }

  /**
   * Busca múltiplas skins de uma vez
   */
  getMultipleSkinInfos(skinNames: string[]): Map<string, ValorantSkin> {
    const results = new Map<string, ValorantSkin>();
    
    for (const skinName of skinNames) {
      const skinInfo = this.getSkinInfo(skinName);
      if (skinInfo) {
        results.set(skinName, skinInfo);
      }
    }

    return results;
  }

  /**
   * Retorna o tamanho do cache atual
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Limpa o cache em memória
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('[SkinsCache] Cache em memória limpo');
  }
}

