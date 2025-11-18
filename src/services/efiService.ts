import EfiPay from 'sdk-node-apis-efi';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class EfiService {
  private efipay: EfiPay;
  private sandbox: boolean;

  constructor() {
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const certificatePath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12';
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64;
    const sandboxEnv = process.env.EFI_SANDBOX;
    this.sandbox = sandboxEnv === 'true';

    logger.info(`[EFI] Configuração detectada:`);
    logger.info(`[EFI] EFI_SANDBOX (raw): "${sandboxEnv}"`);
    logger.info(`[EFI] EFI_SANDBOX (parsed): ${this.sandbox} (${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
    logger.info(`[EFI] EFI_CLIENT_ID: ${clientId ? `${clientId.substring(0, 10)}...` : 'NÃO CONFIGURADO'}`);
    logger.info(`[EFI] EFI_CLIENT_SECRET: ${clientSecret ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    logger.info(`[EFI] EFI_CERTIFICATE_BASE64: ${certificateBase64 ? `SIM (${certificateBase64.length} chars)` : 'NÃO CONFIGURADO'}`);
    logger.info(`[EFI] EFI_CERTIFICATE_PATH: ${certificatePath}`);

    if (!clientId || !clientSecret) {
      throw new Error('EFI_CLIENT_ID e EFI_CLIENT_SECRET são obrigatórios');
    }

    let tempCertPath: string | null = null;
    if (certificateBase64) {
      try {
        
        const cleanBase64 = certificateBase64
          .replace(/\s/g, '') 
          .replace(/\n/g, '')  
          .replace(/\r/g, '')  
          .replace(/\t/g, '')  
          .trim();              
        
        logger.info(`Processando certificado base64 (tamanho original: ${certificateBase64.length}, limpo: ${cleanBase64.length})`);
        
        if (cleanBase64.length === 0) {
          throw new Error('Certificado base64 está vazio após limpeza');
        }
        
        const certBuffer = Buffer.from(cleanBase64, 'base64');

        if (certBuffer.length === 0) {
          throw new Error('Falha ao decodificar certificado base64 - buffer vazio');
        }

        if (certBuffer.length < 500) {
          logger.warn(`Certificado parece muito pequeno: ${certBuffer.length} bytes`);
        }
        
        tempCertPath = path.join(process.cwd(), 'temp_certificado.p12');
        fs.writeFileSync(tempCertPath, certBuffer);
        logger.info(`Certificado carregado de variável de ambiente (base64) - ${certBuffer.length} bytes salvos em ${tempCertPath}`);

        if (!fs.existsSync(tempCertPath)) {
          throw new Error('Falha ao criar arquivo temporário do certificado');
        }
        
        const fileStats = fs.statSync(tempCertPath);
        logger.info(`Arquivo certificado criado: ${fileStats.size} bytes`);
      } catch (error: any) {
        logger.error('Erro ao processar certificado base64:', error);
        logger.error('Stack:', error.stack);
        throw new Error(`Erro ao processar certificado base64: ${error.message}`);
      }
    } else {
      
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

    if (process.env.EFI_CERTIFICATE_PASSWORD) {
      options.certificate_password = process.env.EFI_CERTIFICATE_PASSWORD;
    }

    try {
      logger.info(`[EFI] Inicializando EfiPay:`);
      logger.info(`[EFI]   - sandbox: ${this.sandbox} (${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'})`);
      logger.info(`[EFI]   - certificado: ${finalCertPath}`);
      logger.info(`[EFI]   - certificado existe: ${fs.existsSync(finalCertPath)}`);
      if (fs.existsSync(finalCertPath)) {
        const certStats = fs.statSync(finalCertPath);
        logger.info(`[EFI]   - tamanho do certificado: ${certStats.size} bytes`);
      }
      logger.info(`[EFI]   - senha do certificado: ${process.env.EFI_CERTIFICATE_PASSWORD ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
      
      this.efipay = new EfiPay(options);
      logger.info(`[EFI] EfiService inicializado com sucesso (sandbox: ${this.sandbox})`);
    } catch (error: any) {
      logger.error('[EFI] Erro ao inicializar EfiPay:', error);
      logger.error('[EFI] Opções usadas:', JSON.stringify({ ...options, certificate: '[REDACTED]', client_secret: '[REDACTED]' }, null, 2));
      throw new Error(`Erro ao inicializar EfiPay: ${error.message || 'Erro desconhecido'}`);
    }
  }

  async createCharge(params: {
    txid?: string; 
    valor: number; 
    chave?: string; 
    solicitacaoPagador?: string; 
  }): Promise<{
    txid: string;
    location: number; 
    status: string;
    valor: { original: string };
    chave: string;
    solicitacaoPagador?: string;
  }> {
    try {
      
      logger.info(`[EFI] Criando cobrança PIX:`);
      logger.info(`[EFI]   - Ambiente: ${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
      logger.info(`[EFI]   - Valor: R$ ${params.valor} (${Math.round(params.valor * 100)} centavos)`);
      logger.info(`[EFI]   - TXID: ${params.txid || 'Será gerado pela EfiBank'}`);

      const pixKey = params.chave || process.env.EFI_PIX_KEY;
      if (!pixKey) {
        const errorMsg = 'Chave PIX não configurada. Configure EFI_PIX_KEY no Railway ou forneça via parâmetro.';
        logger.error(`[EFI] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      logger.info(`[EFI]   - Chave PIX: ${pixKey.substring(0, 10)}...${pixKey.substring(pixKey.length - 4)}`);
      
      const valorEmCentavos = Math.round(params.valor * 100);

      const chargeData: any = {
        calendario: {
          expiracao: 3600, 
        },
        valor: {
          original: valorEmCentavos.toFixed(2),
        },
        chave: pixKey, 
      };

      if (params.solicitacaoPagador) {
        chargeData.solicitacaoPagador = params.solicitacaoPagador;
      }

      // Adiciona URL do webhook se configurada
      const webhookUrl = process.env.WEBHOOK_URL || process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'lztmarketxyz-production.up.railway.app'}/webhook/pix`
        : null;
      
      if (webhookUrl) {
        chargeData.solicitacaoPagador = chargeData.solicitacaoPagador || '';
        // A EfiBank pode aceitar webhook no payload da cobrança
        // Tentamos adicionar como campo adicional (se suportado pela API)
        logger.info(`[EFI] Tentando adicionar webhook URL: ${webhookUrl}`);
        // Nota: A estrutura exata depende da API da EfiBank
        // Se não funcionar, o webhook pode ser configurado globalmente via API separada
      }

      let response;

      if (params.txid) {
        
        logger.info(`[EFI] Criando cobrança PIX com txid: ${params.txid}`);
        response = await this.efipay.pixCreateImmediateCharge({ txid: params.txid }, chargeData);
      } else {
        
        logger.info(`[EFI] Criando cobrança PIX (EfiBank gerará txid)`);
        response = await this.efipay.pixCreateImmediateCharge({}, chargeData);
      }

      const locationId = response.loc?.id;
      if (!locationId) {
        logger.error('[EFI] Resposta da API não contém location ID:', JSON.stringify(response, null, 2));
        throw new Error('Location ID não retornado pela API da EfiBank. Não é possível gerar QR Code.');
      }
      
      logger.info(`[EFI] Cobrança PIX criada: txid=${response.txid}, location=${locationId}`);
      
      return {
        txid: response.txid,
        location: locationId,
        status: response.status,
        valor: response.valor,
        chave: response.chave,
        solicitacaoPagador: response.solicitacaoPagador,
      };
    } catch (error: any) {
      logger.error('Erro ao criar cobrança PIX', error);
      logger.error('Detalhes do erro:', JSON.stringify(error, null, 2));

      let errorMessage = error.message || 'Erro desconhecido';
      let errorObj: any = {};

      try {
        if (typeof error === 'string') {
          errorObj = JSON.parse(error);
        } else if (error.error) {
          errorObj = error;
        }
      } catch (e) {
        
      }

      if (errorObj.error === 'invalid_client' || errorMessage.includes('Invalid or inactive credentials')) {
        errorMessage = 'Credenciais inválidas ou inativas\n\n';
        errorMessage += '💡 Possíveis causas:\n';
        errorMessage += `1. CLIENT_ID ou CLIENT_SECRET incorretos\n`;
        errorMessage += `2. Credenciais de SANDBOX sendo usadas em PRODUÇÃO (ou vice-versa)\n`;
        errorMessage += `3. Credenciais inativas ou expiradas\n\n`;
        errorMessage += `📋 Verifique:\n`;
        errorMessage += `- EFI_CLIENT_ID está correto?\n`;
        errorMessage += `- EFI_CLIENT_SECRET está correto?\n`;
        errorMessage += `- EFI_SANDBOX=${this.sandbox} corresponde às credenciais?\n`;
        errorMessage += `- As credenciais são do ambiente ${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}?`;
      } else if (errorMessage.includes('sandbox') || errorMessage.includes('certificate') || errorMessage.includes('atributo')) {
        errorMessage = '❌ **Erro de configuração: Certificado e ambiente não correspondem**\n\n';
        errorMessage += '🔍 **Diagnóstico:**\n';
        errorMessage += `- Ambiente configurado: ${this.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}\n`;
        errorMessage += `- EFI_SANDBOX=${process.env.EFI_SANDBOX}\n\n`;
        errorMessage += '💡 **Solução:**\n';
        errorMessage += `1. Se você tem certificado de **PRODUÇÃO**:\n`;
        errorMessage += `   → Configure \`EFI_SANDBOX=false\` no Railway\n`;
        errorMessage += `   → Use credenciais de **PRODUÇÃO**\n\n`;
        errorMessage += `2. Se você tem certificado de **SANDBOX**:\n`;
        errorMessage += `   → Configure \`EFI_SANDBOX=true\` no Railway\n`;
        errorMessage += `   → Use credenciais de **SANDBOX**\n\n`;
        errorMessage += `3. Verifique também:\n`;
        errorMessage += `   → O certificado está correto?\n`;
        errorMessage += `   → As credenciais (CLIENT_ID e CLIENT_SECRET) correspondem ao ambiente?\n`;
        errorMessage += `   → O certificado tem senha? Configure \`EFI_CERTIFICATE_PASSWORD\` se necessário\n`;
      }
      
      throw new Error(`Erro ao criar cobrança PIX: ${errorMessage}`);
    }
  }

  async generateQRCode(locationId: number | string): Promise<{
    qrcode: string; 
    imagemQrcode?: string; 
  }> {
    try {
      
      const locationIdNumber = typeof locationId === 'string' ? parseInt(locationId, 10) : locationId;
      
      if (isNaN(locationIdNumber)) {
        throw new Error(`Location ID inválido: ${locationId}`);
      }
      
      logger.info(`[EFI] Gerando QR Code para location: ${locationIdNumber} (tipo: ${typeof locationId})`);
      
      const response = await this.efipay.pixGenerateQRCode({ id: locationIdNumber });

      logger.info('[EFI] QR Code gerado com sucesso');
      
      if (!response.qrcode) {
        throw new Error('QR Code não retornado pela API da EfiBank');
      }
      
      return {
        qrcode: response.qrcode,
        imagemQrcode: response.imagemQrcode,
      };
    } catch (error: any) {
      logger.error('[EFI] Erro ao gerar QR Code', error);
      logger.error('[EFI] Detalhes do erro:', JSON.stringify(error, null, 2));

      let errorMessage = 'Erro desconhecido ao gerar QR Code';
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        } else if (error.nome || error.mensagem) {
          
          errorMessage = `${error.nome || 'Erro'}: ${error.mensagem || JSON.stringify(error)}`;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch (e) {
            errorMessage = String(error);
          }
        }
      }
      
      throw new Error(`Erro ao gerar QR Code: ${errorMessage}`);
    }
  }

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

