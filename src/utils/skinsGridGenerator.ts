import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';
import { SkinsCacheService } from '../services/skinsCacheService';

interface SkinData {
  name: string;
  rarity?: string;
  imageUrl?: string;
}

interface GridSkinInfo {
  name: string;
  imagePath: string;
  rarity: 'Select' | 'Deluxe' | 'Premium' | 'Exclusive' | 'Ultra' | 'Unknown';
  displayIcon: string;
}

// Cores das bordas por raridade
const RARITY_COLORS: Record<string, string> = {
  'Select': '#538DD5',      // RGB(83, 141, 213) - Azul
  'Deluxe': '#46A38D',      // RGB(70, 163, 141) - Verde
  'Premium': '#D1548E',     // RGB(209, 84, 142) - Rosa
  'Exclusive': '#FFB94B',   // RGB(255, 185, 75) - Laranja
  'Ultra': '#FFD700',        // RGB(255, 215, 0) - Dourado
  'Unknown': '#808080',      // RGB(128, 128, 128) - Cinza
};

// Ordem de raridade para ordenação
const RARITY_ORDER: Record<string, number> = {
  'Ultra': 5,
  'Exclusive': 4,
  'Premium': 3,
  'Deluxe': 2,
  'Select': 1,
  'Unknown': 0,
};

const CARD_WIDTH = 300;
const CARD_HEIGHT = 200;
const CARD_PADDING = 15;
const BORDER_WIDTH = 4;
const GRID_COLS = 3;
const BACKGROUND_COLOR = '#1E1E23'; // RGB(30, 30, 35)

export class SkinsGridGenerator {
  private cacheService: SkinsCacheService;
  private skinsCacheDir: string;

  constructor(cacheService: SkinsCacheService) {
    this.cacheService = cacheService;
    this.skinsCacheDir = path.join(process.cwd(), 'cache', 'skins');
  }

  /**
   * Garante que o diretório de cache de imagens existe
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.access(this.skinsCacheDir);
    } catch {
      await fs.mkdir(this.skinsCacheDir, { recursive: true });
      logger.info(`[SkinsGrid] Diretório de cache de imagens criado: ${this.skinsCacheDir}`);
    }
  }

  /**
   * Normaliza nome da skin para nome de arquivo
   */
  private normalizeFileName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .trim();
  }

  /**
   * Retorna caminho da imagem em cache
   */
  private getCachedImagePath(skinName: string): string {
    const fileName = `${this.normalizeFileName(skinName)}.png`;
    return path.join(this.skinsCacheDir, fileName);
  }

  /**
   * Baixa imagem da skin com cache em disco
   */
  async downloadSkinWithCache(url: string, skinName: string): Promise<string | null> {
    try {
      await this.ensureCacheDirectory();
      
      const cachedPath = this.getCachedImagePath(skinName);
      
      // Verificar se já existe em cache
      try {
        await fs.access(cachedPath);
        logger.info(`[SkinsGrid] Imagem encontrada em cache: ${skinName}`);
        return cachedPath;
      } catch {
        // Não existe em cache, precisa baixar
      }

      // Baixar imagem
      logger.info(`[SkinsGrid] Baixando imagem: ${skinName} de ${url.substring(0, 50)}...`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 segundos
      });

      // Salvar em cache
      await fs.writeFile(cachedPath, response.data);
      logger.info(`[SkinsGrid] ✅ Imagem salva em cache: ${cachedPath}`);

      return cachedPath;
    } catch (error: any) {
      logger.warn(`[SkinsGrid] ⚠️ Erro ao baixar imagem de ${skinName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Mapeia raridade da LZT para raridade da API Valorant
   */
  private mapRarity(lztRarity?: string): GridSkinInfo['rarity'] {
    if (!lztRarity) return 'Unknown';
    
    const rarityLower = lztRarity.toLowerCase();
    if (rarityLower.includes('ultra')) return 'Ultra';
    if (rarityLower.includes('exclusive')) return 'Exclusive';
    if (rarityLower.includes('premium')) return 'Premium';
    if (rarityLower.includes('deluxe')) return 'Deluxe';
    if (rarityLower.includes('select')) return 'Select';
    
    return 'Unknown';
  }

  /**
   * Ordena skins por raridade (mais raras primeiro)
   */
  private sortSkinsByRarity(skins: GridSkinInfo[]): GridSkinInfo[] {
    return [...skins].sort((a, b) => {
      const aOrder = RARITY_ORDER[a.rarity] || 0;
      const bOrder = RARITY_ORDER[b.rarity] || 0;
      
      if (bOrder !== aOrder) {
        return bOrder - aOrder; // Ordem decrescente (mais raro primeiro)
      }
      
      // Se mesma raridade, ordenar alfabeticamente
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Processa lista de skins da conta e busca informações completas
   */
  private async processSkins(skins: SkinData[]): Promise<GridSkinInfo[]> {
    const processedSkins: GridSkinInfo[] = [];

    for (const skin of skins) {
      try {
        // Buscar informações da skin no cache
        const skinInfo = this.cacheService.getSkinInfo(skin.name);
        
        if (skinInfo) {
          // Baixar imagem com cache
          const imagePath = await this.downloadSkinWithCache(skinInfo.displayIcon, skin.name);
          
          if (imagePath) {
            processedSkins.push({
              name: skinInfo.displayName,
              imagePath: imagePath,
              rarity: skinInfo.rarity,
              displayIcon: skinInfo.displayIcon,
            });
          } else {
            logger.warn(`[SkinsGrid] Não foi possível baixar imagem para: ${skin.name}`);
          }
        } else {
          logger.warn(`[SkinsGrid] Skin não encontrada no cache: ${skin.name}`);
        }
      } catch (error: any) {
        logger.error(`[SkinsGrid] Erro ao processar skin ${skin.name}: ${error.message}`);
      }
    }

    return processedSkins;
  }

  /**
   * Gera imagem grid com todas as skins
   */
  async generateSkinsGridImage(skins: SkinData[], gridCols: number = GRID_COLS): Promise<Buffer | null> {
    try {
      logger.info(`[SkinsGrid] Gerando grid para ${skins.length} skins...`);

      // Processar skins (buscar informações e baixar imagens)
      let processedSkins = await this.processSkins(skins);

      if (processedSkins.length === 0) {
        logger.warn('[SkinsGrid] Nenhuma skin processada com sucesso');
        return null;
      }

      // Ordenar por raridade e limitar a 15
      processedSkins = this.sortSkinsByRarity(processedSkins).slice(0, 15);

      // Calcular dimensões do grid
      const rows = Math.ceil(processedSkins.length / gridCols);
      const totalWidth = (CARD_WIDTH + CARD_PADDING) * gridCols - CARD_PADDING;
      const totalHeight = (CARD_HEIGHT + CARD_PADDING) * rows - CARD_PADDING;

      logger.info(`[SkinsGrid] Grid: ${gridCols}x${rows} (${totalWidth}x${totalHeight}px)`);

      // Criar canvas
      const canvas = createCanvas(totalWidth, totalHeight);
      const ctx = canvas.getContext('2d');

      // Preencher fundo
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Desenhar cada skin no grid
      for (let i = 0; i < processedSkins.length; i++) {
        const skin = processedSkins[i];
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;

        const x = col * (CARD_WIDTH + CARD_PADDING);
        const y = row * (CARD_HEIGHT + CARD_PADDING);

        try {
          // Carregar imagem
          const image = await loadImage(skin.imagePath);
          
          // Desenhar borda colorida
          const borderColor = RARITY_COLORS[skin.rarity] || RARITY_COLORS['Unknown'];
          ctx.fillStyle = borderColor;
          ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

          // Desenhar área interna (fundo do card)
          ctx.fillStyle = '#2A2A2E'; // Fundo ligeiramente mais claro que o grid
          ctx.fillRect(
            x + BORDER_WIDTH,
            y + BORDER_WIDTH,
            CARD_WIDTH - BORDER_WIDTH * 2,
            CARD_HEIGHT - BORDER_WIDTH * 2
          );

          // Calcular dimensões da imagem para centralizar
          const imagePadding = 10;
          const imageWidth = CARD_WIDTH - BORDER_WIDTH * 2 - imagePadding * 2;
          const imageHeight = CARD_HEIGHT - BORDER_WIDTH * 2 - imagePadding * 2;

          // Calcular escala mantendo proporção
          const scaleX = imageWidth / image.width;
          const scaleY = imageHeight / image.height;
          const scale = Math.min(scaleX, scaleY);

          const scaledWidth = image.width * scale;
          const scaledHeight = image.height * scale;

          // Centralizar imagem
          const imageX = x + BORDER_WIDTH + (CARD_WIDTH - BORDER_WIDTH * 2 - scaledWidth) / 2;
          const imageY = y + BORDER_WIDTH + (CARD_HEIGHT - BORDER_WIDTH * 2 - scaledHeight) / 2;

          // Desenhar imagem
          ctx.drawImage(image, imageX, imageY, scaledWidth, scaledHeight);

          logger.info(`[SkinsGrid] ✅ Skin ${i + 1}/${processedSkins.length} desenhada: ${skin.name}`);
        } catch (error: any) {
          logger.error(`[SkinsGrid] Erro ao desenhar skin ${skin.name}: ${error.message}`);
          // Continuar com próxima skin mesmo se esta falhar
        }
      }

      // Converter para buffer
      const buffer = canvas.toBuffer('image/png');
      logger.info(`[SkinsGrid] ✅ Grid gerado com sucesso (${buffer.length} bytes)`);

      return buffer;
    } catch (error: any) {
      logger.error(`[SkinsGrid] Erro ao gerar grid: ${error.message}`);
      logger.error(`[SkinsGrid] Stack: ${error.stack}`);
      return null;
    }
  }
}

