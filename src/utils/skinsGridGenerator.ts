import { createCanvas, loadImage } from 'canvas';
import { logger } from './logger';
import { SkinsCacheService } from '../services/skinsCacheService';

interface SkinData {
  name: string;
  rarity?: string;
  imageUrl?: string;
}

interface GridSkinInfo {
  name: string;
  imageUrl: string;
  rarity: 'Select' | 'Deluxe' | 'Premium' | 'Exclusive' | 'Ultra' | 'Unknown';
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

  constructor(cacheService: SkinsCacheService) {
    this.cacheService = cacheService;
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
   * Carrega imagem com retry em caso de falha
   */
  private async loadImageWithRetry(
    imageUrl: string,
    skinName: string,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[SkinsGrid] Tentativa ${attempt}/${maxRetries} de carregar imagem para ${skinName}...`);
        logger.info(`[SkinsGrid] URL: ${imageUrl.substring(0, 80)}...`);
        
        const image = await loadImage(imageUrl);
        logger.info(`[SkinsGrid] ✅ Imagem carregada com sucesso na tentativa ${attempt}`);
        return image;
      } catch (error: any) {
        lastError = error;
        logger.warn(`[SkinsGrid] ⚠️ Tentativa ${attempt} falhou: ${error.message}`);
        
        // Se não for a última tentativa, esperar um pouco antes de tentar novamente
        if (attempt < maxRetries) {
          const waitTime = attempt * 500; // 500ms, 1000ms, 1500ms...
          logger.info(`[SkinsGrid] Aguardando ${waitTime}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    logger.error(`[SkinsGrid] ❌ Falhou ao carregar imagem após ${maxRetries} tentativas: ${lastError?.message}`);
    return null;
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
   * Estratégia de busca de imagem (em ordem de prioridade):
   * 1. image_url da LZT (se disponível)
   * 2. Busca no cache pelo nome da skin
   * 3. Tenta buscar no cache com nome normalizado
   */
  private processSkins(skins: SkinData[]): GridSkinInfo[] {
    const processedSkins: GridSkinInfo[] = [];

    for (const skin of skins) {
      try {
        let imageUrl: string | null = null;
        let displayName = skin.name;
        let rarity: GridSkinInfo['rarity'] = this.mapRarity(skin.rarity);

        // ESTRATÉGIA 1: Usar image_url da LZT (prioridade máxima)
        if (skin.imageUrl) {
          imageUrl = skin.imageUrl;
          logger.info(`[SkinsGrid] ✅ Usando image_url da LZT para: ${skin.name}`);
        }

        // ESTRATÉGIA 2: Buscar no cache pelo nome
        if (!imageUrl) {
          const skinInfo = this.cacheService.getSkinInfo(skin.name);
          
          if (skinInfo && skinInfo.displayIcon) {
            imageUrl = skinInfo.displayIcon;
            displayName = skinInfo.displayName;
            rarity = skinInfo.rarity;
            logger.info(`[SkinsGrid] ✅ Skin encontrada no cache: ${skin.name} -> ${skinInfo.displayName} (${skinInfo.rarity})`);
          } else {
            logger.warn(`[SkinsGrid] ⚠️ Skin não encontrada no cache: ${skin.name}`);
          }
        }

        // Se encontrou imagem, adicionar à lista
        if (imageUrl) {
          processedSkins.push({
            name: displayName,
            imageUrl: imageUrl,
            rarity: rarity,
          });
        } else {
          logger.warn(`[SkinsGrid] ⚠️ Nenhuma imagem encontrada para skin: ${skin.name}`);
        }
      } catch (error: any) {
        logger.error(`[SkinsGrid] Erro ao processar skin ${skin.name}: ${error.message}`);
      }
    }

    return processedSkins;
  }

  /**
   * Gera imagem grid com todas as skins
   * Carrega imagens diretamente de URLs (sem download/cache)
   */
  async generateSkinsGridImage(skins: SkinData[], gridCols: number = GRID_COLS): Promise<Buffer | null> {
    try {
      logger.info(`[SkinsGrid] Gerando grid para ${skins.length} skins...`);

      // Processar skins (buscar informações - URLs já estão no cache)
      let processedSkins = this.processSkins(skins);

      if (processedSkins.length === 0) {
        logger.warn('[SkinsGrid] Nenhuma skin processada com sucesso');
        return null;
      }

      // Ordenar por raridade e limitar a 15
      processedSkins = this.sortSkinsByRarity(processedSkins).slice(0, 15);

      logger.info(`[SkinsGrid] ${processedSkins.length} skins processadas, gerando grid...`);

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
          // Carregar imagem com retry e tratamento de erro robusto
          const image = await this.loadImageWithRetry(skin.imageUrl, skin.name, 3);
          
          if (!image) {
            logger.warn(`[SkinsGrid] ⚠️ Não foi possível carregar imagem para ${skin.name}, pulando...`);
            // Desenhar card vazio com borda
            const borderColor = RARITY_COLORS[skin.rarity] || RARITY_COLORS['Unknown'];
            ctx.fillStyle = borderColor;
            ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
            ctx.fillStyle = '#2A2A2E';
            ctx.fillRect(
              x + BORDER_WIDTH,
              y + BORDER_WIDTH,
              CARD_WIDTH - BORDER_WIDTH * 2,
              CARD_HEIGHT - BORDER_WIDTH * 2
            );
            // Desenhar texto "Sem imagem"
            ctx.fillStyle = '#808080';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sem imagem', x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
            continue;
          }
          
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
          logger.error(`[SkinsGrid] ❌ Erro ao carregar/desenhar skin ${skin.name}: ${error.message}`);
          logger.error(`[SkinsGrid] URL: ${skin.imageUrl}`);
          // Desenhar card vazio com borda em caso de erro
          const borderColor = RARITY_COLORS[skin.rarity] || RARITY_COLORS['Unknown'];
          ctx.fillStyle = borderColor;
          ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
          ctx.fillStyle = '#2A2A2E';
          ctx.fillRect(
            x + BORDER_WIDTH,
            y + BORDER_WIDTH,
            CARD_WIDTH - BORDER_WIDTH * 2,
            CARD_HEIGHT - BORDER_WIDTH * 2
          );
        }
      }

      // Converter para buffer
      const buffer = canvas.toBuffer('image/png');
      logger.info(`[SkinsGrid] ✅ Grid gerado com sucesso (${buffer.length} bytes)`);

      return buffer;
    } catch (error: any) {
      logger.error(`[SkinsGrid] ❌ Erro ao gerar grid: ${error.message}`);
      logger.error(`[SkinsGrid] Stack: ${error.stack}`);
      return null;
    }
  }
}
