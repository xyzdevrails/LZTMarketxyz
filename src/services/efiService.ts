import EfiPay from 'sdk-node-apis-efi';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';

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

      // NOTA: notification_url não é suportado no payload da cobrança PIX imediata da EfiBank
      // O webhook precisa ser configurado separadamente via API ou painel
      // Por enquanto, removemos para evitar erro de "propriedades adicionais não permitidas"

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

  /**
   * Registra webhook para notificações PIX automáticas
   * @param webhookUrl URL pública do webhook (ex: https://seu-dominio.com/webhook)
   * @param pixKey Chave PIX para associar o webhook
   * @param skipMtls Se true, usa skip-mTLS (recomendado para Railway)
   * @returns Informações do webhook registrado
   */
  async registerWebhook(webhookUrl: string, pixKey?: string, skipMtls: boolean = true): Promise<any> {
    try {
      const chave = pixKey || process.env.EFI_PIX_KEY;
      
      if (!chave) {
        throw new Error('Chave PIX não configurada. Configure EFI_PIX_KEY.');
      }

      // Adiciona ?ignorar= para evitar que a EfiBank adicione /pix no final
      // Isso permite usar a mesma URL para registro e recebimento
      const webhookUrlWithParam = webhookUrl.includes('?') 
        ? `${webhookUrl}&ignorar=`
        : `${webhookUrl}?ignorar=`;

      logger.info(`[EFI] Registrando webhook PIX:`);
      logger.info(`[EFI]   - URL: ${webhookUrlWithParam}`);
      logger.info(`[EFI]   - Chave PIX: ${chave.substring(0, 10)}...${chave.substring(chave.length - 4)}`);
      logger.info(`[EFI]   - Skip-mTLS: ${skipMtls}`);

      const baseUrl = this.sandbox 
        ? 'https://pix-h.api.efipay.com.br'
        : 'https://pix.api.efipay.com.br';
      
      const url = `${baseUrl}/v2/webhook/${chave}`;
      
      // Prepara headers
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (skipMtls) {
        headers['x-skip-mtls-checking'] = 'true';
      }

      // Usa o método PUT do SDK através do método genérico
      // O SDK tem um método genérico que podemos usar
      const requestData = {
        webhookUrl: webhookUrlWithParam
      };

      // Obtém token de acesso OAuth primeiro
      const tokenUrl = this.sandbox
        ? 'https://pix-h.api.efipay.com.br/oauth/token'
        : 'https://pix.api.efipay.com.br/oauth/token';
      
      const clientId = process.env.EFI_CLIENT_ID;
      const clientSecret = process.env.EFI_CLIENT_SECRET;
      const certPath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12';
      const certPassword = process.env.EFI_CERTIFICATE_PASSWORD;
      
      // Carrega certificado
      let finalCertPath = certPath;
      if (process.env.EFI_CERTIFICATE_BASE64) {
        // Se tiver base64, usa o temp
        finalCertPath = path.join(process.cwd(), 'temp_certificado.p12');
        if (!fs.existsSync(finalCertPath)) {
          throw new Error('Certificado temporário não encontrado. Reinicie o bot.');
        }
      }
      
      if (!fs.existsSync(finalCertPath)) {
        throw new Error(`Certificado não encontrado em: ${finalCertPath}`);
      }

      // Configura agente HTTPS com certificado
      const certBuffer = fs.readFileSync(finalCertPath);
      const httpsAgent = new https.Agent({
        pfx: certBuffer,
        passphrase: certPassword || '',
        rejectUnauthorized: true
      });

      // Obtém token OAuth
      logger.info('[EFI] Obtendo token OAuth...');
      const tokenResponse = await axios.post(
        tokenUrl,
        'grant_type=client_credentials',
        {
          httpsAgent,
          auth: {
            username: clientId!,
            password: clientSecret!
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('Não foi possível obter token de acesso');
      }

      logger.info('[EFI] Token OAuth obtido com sucesso');

      // Faz chamada PUT para registrar webhook
      logger.info(`[EFI] Fazendo PUT para: ${url}`);
      const response = await axios.put(
        url,
        requestData,
        {
          httpsAgent,
          headers: {
            ...headers,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      logger.info(`[EFI] ✅ Webhook registrado com sucesso!`);
      logger.info(`[EFI] Resposta: ${JSON.stringify(response.data || response, null, 2)}`);
      
      return response.data || response;
    } catch (error: any) {
      let errorMessage = 'Erro desconhecido';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = `URL inválida ou configuração incorreta: ${JSON.stringify(data)}`;
        } else if (status === 403) {
          errorMessage = 'Acesso negado. Verifique se tem a permissão "Alterar Webhooks" habilitada no painel da EfiBank.';
        } else if (status === 404) {
          errorMessage = 'Chave PIX não encontrada. Verifique se EFI_PIX_KEY está correto.';
        } else {
          errorMessage = `Erro HTTP ${status}: ${JSON.stringify(data)}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = JSON.stringify(error);
      }
      
      logger.error(`[EFI] ❌ Erro ao registrar webhook: ${errorMessage}`);
      throw new Error(`Erro ao registrar webhook: ${errorMessage}`);
    }
  }

  /**
   * Consulta webhook registrado para uma chave PIX
   * @param pixKey Chave PIX (opcional, usa EFI_PIX_KEY se não informado)
   * @returns Informações do webhook ou null se não estiver registrado
   */
  async getWebhook(pixKey?: string): Promise<any | null> {
    try {
      const chave = pixKey || process.env.EFI_PIX_KEY;
      
      if (!chave) {
        throw new Error('Chave PIX não configurada. Configure EFI_PIX_KEY.');
      }

      logger.info(`[EFI] Consultando webhook para chave: ${chave.substring(0, 10)}...${chave.substring(chave.length - 4)}`);

      // Faz chamada GET para consultar webhook
      const baseUrl = this.sandbox 
        ? 'https://pix-h.api.efipay.com.br'
        : 'https://pix.api.efipay.com.br';
      
      const url = `${baseUrl}/v2/webhook/${chave}`;
      
      // Obtém token OAuth (reutiliza lógica do registerWebhook)
      const tokenUrl = this.sandbox
        ? 'https://pix-h.api.efipay.com.br/oauth/token'
        : 'https://pix.api.efipay.com.br/oauth/token';
      
      const clientId = process.env.EFI_CLIENT_ID;
      const clientSecret = process.env.EFI_CLIENT_SECRET;
      const certPath = process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12';
      const certPassword = process.env.EFI_CERTIFICATE_PASSWORD;
      
      let finalCertPath = certPath;
      if (process.env.EFI_CERTIFICATE_BASE64) {
        finalCertPath = path.join(process.cwd(), 'temp_certificado.p12');
        if (!fs.existsSync(finalCertPath)) {
          logger.warn('[EFI] Certificado temporário não encontrado para consultar webhook');
          return null;
        }
      }
      
      if (!fs.existsSync(finalCertPath)) {
        logger.warn(`[EFI] Certificado não encontrado em: ${finalCertPath}`);
        return null;
      }

      const certBuffer = fs.readFileSync(finalCertPath);
      const httpsAgent = new https.Agent({
        pfx: certBuffer,
        passphrase: certPassword || '',
        rejectUnauthorized: true
      });

      try {
        // Obtém token OAuth
        const tokenResponse = await axios.post(
          tokenUrl,
          'grant_type=client_credentials',
          {
            httpsAgent,
            auth: {
              username: clientId!,
              password: clientSecret!
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
          logger.warn('[EFI] Não foi possível obter token para consultar webhook');
          return null;
        }

        // Faz chamada GET
        const response = await axios.get(url, {
          httpsAgent,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        logger.info(`[EFI] Webhook encontrado: ${JSON.stringify(response.data, null, 2)}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          logger.info('[EFI] Webhook não está registrado ainda');
          return null;
        }
        logger.error(`[EFI] Erro ao consultar webhook: ${error.message || error}`);
        throw error;
      }
    } catch (error: any) {
      logger.error(`[EFI] Erro ao consultar webhook: ${error.message || error}`);
      throw error;
    }
  }
}

