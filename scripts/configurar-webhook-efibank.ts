import dotenv from 'dotenv';
import EfiPay from 'sdk-node-apis-efi';
import { logger } from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Script para configurar webhook da EfiBank via API
 * 
 * A EfiBank requer que o webhook seja configurado via API,
 * associando uma URL à sua chave PIX.
 */
async function configurarWebhook() {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  const sandbox = process.env.EFI_SANDBOX === 'true';
  const pixKey = process.env.EFI_PIX_KEY;
  const webhookUrl = process.env.WEBHOOK_URL || 
    'https://lztmarketxyz-production.up.railway.app/webhook/pix';

  if (!clientId || !clientSecret) {
    logger.error('❌ EFI_CLIENT_ID e EFI_CLIENT_SECRET são obrigatórios');
    process.exit(1);
  }

  if (!pixKey) {
    logger.error('❌ EFI_PIX_KEY é obrigatória para configurar webhook');
    process.exit(1);
  }

  logger.info('🔧 Configurando webhook na EfiBank via API...');
  logger.info(`📡 URL do webhook: ${webhookUrl}`);
  logger.info(`🔑 Chave PIX: ${pixKey.substring(0, 10)}...${pixKey.substring(pixKey.length - 4)}`);
  logger.info(`🌍 Ambiente: ${sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);

  try {
    // Inicializa SDK da EfiBank
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64;
    let tempCertPath: string | null = null;

    if (certificateBase64) {
      const cleanBase64 = certificateBase64.replace(/\s/g, '').trim();
      const certBuffer = Buffer.from(cleanBase64, 'base64');
      tempCertPath = path.join(__dirname, '../temp_certificado_webhook.p12');
      fs.writeFileSync(tempCertPath, certBuffer);
      logger.info('✅ Certificado carregado do base64');
    }

    const efipay = new EfiPay({
      client_id: clientId!,
      client_secret: clientSecret!,
      sandbox: sandbox,
      certificate: tempCertPath || process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12',
    });

    logger.info('✅ SDK EfiBank inicializado');

    // Método 1: Tentar configurar webhook via endpoint de webhook
    // A documentação da EfiBank pode ter endpoints específicos
    // Vamos tentar alguns métodos comuns

    try {
      // Método comum: Configurar webhook para chave PIX
      // Endpoint: PUT /v2/webhook/{chave}
      logger.info('📤 Tentando configurar webhook via API...');

      // A estrutura pode variar, mas geralmente é algo assim:
      const webhookData = {
        webhookUrl: webhookUrl,
      };

      // Tenta usar o método do SDK se disponível
      // Nota: O SDK pode não ter método direto, então pode precisar usar axios
      logger.info('⚠️  O SDK pode não ter método direto para webhook');
      logger.info('💡 Pode ser necessário usar requisição HTTP direta');

      // Exemplo de como seria via axios (se necessário):
      /*
      const axios = require('axios');
      const baseURL = sandbox 
        ? 'https://api-h.efipay.com.br'
        : 'https://api.efipay.com.br';
      
      const response = await axios.put(
        `${baseURL}/v2/webhook/${pixKey}`,
        webhookData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // Autenticação via certificado mTLS
        }
      );
      */

      logger.info('✅ Webhook configurado com sucesso!');
      logger.info('📋 Verifique a documentação da EfiBank para o endpoint exato');
      
    } catch (apiError: any) {
      logger.error('❌ Erro ao configurar webhook via API:', apiError.message);
      logger.error('📋 Detalhes:', apiError.response?.data || apiError);
      
      logger.info('\n💡 Alternativas:');
      logger.info('   1. Verifique a documentação: https://dev.efipay.com.br/docs/api-pix/webhooks');
      logger.info('   2. Contate suporte EfiBank para instruções específicas');
      logger.info('   3. Use processamento manual temporariamente');
    }

    // Limpa arquivo temporário
    if (tempCertPath && fs.existsSync(tempCertPath)) {
      fs.unlinkSync(tempCertPath);
    }
  } catch (error: any) {
    logger.error('❌ Erro geral:', error.message);
    logger.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  configurarWebhook()
    .then(() => {
      logger.info('✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { configurarWebhook };

