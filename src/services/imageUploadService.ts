import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Serviço para fazer upload de imagens Base64 para serviços de hospedagem temporária
 * e obter URLs HTTP que o Discord aceita em embeds
 */
export class ImageUploadService {
  /**
   * Faz upload de Base64 para imgbb.com (serviço gratuito de hospedagem de imagens)
   * Retorna URL HTTP da imagem ou null se falhar
   */
  async uploadBase64ToImgBB(base64Data: string): Promise<string | null> {
    try {
      // imgbb.com requer API key, então vamos retornar null por enquanto
      // TODO: Implementar upload para serviço de imagens quando necessário
      logger.info(`[ImageUpload] Base64 recebido mas upload não implementado (requer API key)`);
      return null;
    } catch (error: any) {
      logger.warn(`[ImageUpload] Erro ao fazer upload:`, error.message);
      return null;
    }
  }

  /**
   * Tenta fazer upload para múltiplos serviços até conseguir
   * Retorna URL HTTP da imagem ou null se todos falharem
   */
  async uploadBase64ToAnyService(base64Data: string): Promise<string | null> {
    // Tentar imgbb primeiro
    const imgbbUrl = await this.uploadBase64ToImgBB(base64Data);
    if (imgbbUrl) {
      return imgbbUrl;
    }

    // Se imgbb falhar, retornar null (podemos adicionar mais serviços aqui depois)
    logger.warn(`[ImageUpload] ❌ Não foi possível fazer upload da imagem para nenhum serviço`);
    return null;
  }

  /**
   * Converte Base64 para URL HTTP usando serviço de upload
   * Se falhar, retorna null
   */
  async convertBase64ToUrl(base64Data: string): Promise<string | null> {
    if (!base64Data || base64Data.length < 100) {
      logger.warn(`[ImageUpload] Base64 inválido ou muito pequeno`);
      return null;
    }

    return await this.uploadBase64ToAnyService(base64Data);
  }
}

