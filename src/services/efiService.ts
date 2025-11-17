import EfiPay from 'sdk-node-apis-efi';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Serviço de integração com EfiBank (Efí Pay)
 * Documentação: https://dev.efipay.com.br/docs/api-pix
 */
export class EfiService {
  private efipay: EfiPay;
  private sandbox: boolean;

  constructor() {
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const certificatePath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12';
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64;
    this.sandbox = process.env.EFI_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
      throw new Error('EFI_CLIENT_ID e EFI_CLIENT_SECRET são obrigatórios');
    }

    // Se certificado em base64 está configurado, salva temporariamente
    let tempCertPath: string | null = null;
    if (certificateBase64) {
      try {
        // Remove espaços e quebras de linha do base64
        const cleanBase64 = certificateBase64.replace(/\s/g, '');
        const certBuffer = Buffer.from(cleanBase64, 'base64');
        
        // Valida se o buffer tem conteúdo válido
        if (certBuffer.length === 0) {
          throw new Error('Certificado base64 está vazio ou inválido');
        }
        
        tempCertPath = path.join(process.cwd(), 'temp_certificado.p12');
        fs.writeFileSync(tempCertPath, certBuffer);
        logger.info(`Certificado carregado de variável de ambiente (base64) - ${certBuffer.length} bytes`);
        
        // Verifica se o arquivo foi criado corretamente
        if (!fs.existsSync(tempCertPath)) {
          throw new Error('Falha ao criar arquivo temporário do certificado');
        }
      } catch (error: any) {
        logger.error('Erro ao processar certificado base64:', error);
        throw new Error(`Erro ao processar certificado base64: ${error.message}`);
      }
    } else {
      // Verifica se o certificado existe no caminho especificado
      if (!fs.existsSync(certificatePath)) {
        const errorMsg = `Certificado não encontrado em: ${certificatePath}. É necessário o arquivo .p12 da EfiBank ou configurar EFI_CERTIFICATE_BASE64.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    const finalCertPath = tempCertPath || certificatePath;
    
    const options: any = {
      sandbox: this.sandbox,
      client_id: clientId,
      client_secret: clientSecret,
      certificate: finalCertPath,
    };

    // Adiciona senha do certificado se configurada
    if (process.env.EFI_CERTIFICATE_PASSWORD) {
      options.certificate_password = process.env.EFI_CERTIFICATE_PASSWORD;
    }

    try {
      this.efipay = new EfiPay(options);
      logger.info(`EfiService inicializado (sandbox: ${this.sandbox})`);
    } catch (error: any) {
      logger.error('Erro ao inicializar EfiPay:', error);
      throw new Error(`Erro ao inicializar EfiPay: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria uma cobrança PIX imediata (COB)
   * Documentação: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
   */
  async createCharge(params: {
    txid?: string; // Opcional: se não fornecido, EfiBank gera automaticamente
    valor: number; // Valor em reais (será convertido para centavos)
    chave?: string; // Chave PIX (opcional, usa a chave padrão da conta)
    solicitacaoPagador?: string; // Descrição do pagamento
  }): Promise<{
    txid: string;
    location: number; // Location ID para gerar QR Code
    status: string;
    valor: { original: string };
    chave: string;
    solicitacaoPagador?: string;
  }> {
    try {
      const valorEmCentavos = Math.round(params.valor * 100);

      const chargeData: any = {
        calendario: {
          expiracao: 3600, // 1 hora de validade
        },
        valor: {
          original: valorEmCentavos.toFixed(2),
        },
        chave: params.chave || process.env.EFI_PIX_KEY, // Chave PIX padrão se não informada
      };

      if (params.solicitacaoPagador) {
        chargeData.solicitacaoPagador = params.solicitacaoPagador;
      }

      let response;

      if (params.txid) {
        // Usa PUT para criar com txid próprio
        logger.info(`Criando cobrança PIX com txid: ${params.txid}`);
        response = await this.efipay.pixCreateImmediateCharge({ txid: params.txid }, chargeData);
      } else {
        // Usa POST para criar sem txid (EfiBank gera)
        logger.info(`Criando cobrança PIX (EfiBank gerará txid)`);
        response = await this.efipay.pixCreateImmediateCharge({}, chargeData);
      }

      logger.info(`Cobrança PIX criada: txid=${response.txid}, location=${response.loc.id}`);
      
      return {
        txid: response.txid,
        location: response.loc.id,
        status: response.status,
        valor: response.valor,
        chave: response.chave,
        solicitacaoPagador: response.solicitacaoPagador,
      };
    } catch (error: any) {
      logger.error('Erro ao criar cobrança PIX', error);
      throw new Error(`Erro ao criar cobrança PIX: ${error.message || error}`);
    }
  }

  /**
   * Gera QR Code de uma cobrança usando Location ID
   * Documentação: https://dev.efipay.com.br/docs/api-pix/payload-locations
   */
  async generateQRCode(locationId: number): Promise<{
    qrcode: string; // QR Code em base64 ou texto
    imagemQrcode?: string; // URL da imagem do QR Code (se disponível)
  }> {
    try {
      logger.info(`Gerando QR Code para location: ${locationId}`);
      
      const response = await this.efipay.pixGenerateQRCode({ id: locationId });

      logger.info('QR Code gerado com sucesso');
      
      return {
        qrcode: response.qrcode,
        imagemQrcode: response.imagemQrcode,
      };
    } catch (error: any) {
      logger.error('Erro ao gerar QR Code', error);
      throw new Error(`Erro ao gerar QR Code: ${error.message || error}`);
    }
  }

  /**
   * Consulta uma cobrança por txid
   */
  async getCharge(txid: string): Promise<any> {
    try {
      logger.info(`Consultando cobrança: ${txid}`);
      const response = await this.efipay.pixDetailCharge({ txid });
      return response;
    } catch (error: any) {
      logger.error('Erro ao consultar cobrança', error);
      throw new Error(`Erro ao consultar cobrança: ${error.message || error}`);
    }
  }
}

