import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { WebhookHandler } from '../handlers/webhookHandler';
import { BalanceService } from '../services/balanceService';
import { Client } from 'discord.js';

/**
 * Servidor HTTP para receber webhooks da EfiBank
 * 
 * Documentação EfiBank Webhooks:
 * https://dev.efipay.com.br/docs/api-pix/webhooks
 */
export class WebhookServer {
  private app: express.Application;
  private port: number;
  private server: any = null;
  private webhookHandler: WebhookHandler | null = null;

  constructor(
    port: number = 3000,
    balanceService?: BalanceService,
    discordClient?: Client
  ) {
    this.app = express();
    this.port = port;
    
    // Inicializa handler se serviços estiverem disponíveis
    if (balanceService && discordClient) {
      this.webhookHandler = new WebhookHandler(balanceService, discordClient);
      logger.info('[WEBHOOK] WebhookHandler inicializado com sucesso');
    } else {
      logger.warn('[WEBHOOK] WebhookHandler não inicializado (serviços não disponíveis)');
    }
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Configura middleware do Express
   */
  private setupMiddleware(): void {
    // Middleware para parsear JSON (webhooks da EfiBank vêm como JSON)
    this.app.use(express.json());
    
    // Middleware para logging de todas as requisições
    this.app.use((req: Request, res: Response, next) => {
      logger.info(`[WEBHOOK] ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  /**
   * Configura rotas do servidor
   */
  private setupRoutes(): void {
    // Rota de health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'webhook-server' });
    });

    // Rota principal de webhook PIX
    this.app.post('/webhook/pix', async (req: Request, res: Response) => {
      try {
        logger.info('[WEBHOOK] ========================================');
        logger.info('[WEBHOOK] Recebido webhook PIX');
        logger.info('[WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
        logger.info('[WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
        logger.info('[WEBHOOK] IP:', req.ip);
        logger.info('[WEBHOOK] ========================================');
        
        // Se handler estiver disponível, processa o webhook
        if (this.webhookHandler) {
          const result = await this.webhookHandler.processPixWebhook(req.body);
          
          if (result.success) {
            logger.info(`[WEBHOOK] Webhook processado: ${result.message}`);
            res.status(200).json({ 
              received: true,
              processed: result.processed || false,
              timestamp: new Date().toISOString(),
              message: result.message
            });
          } else {
            logger.error(`[WEBHOOK] Erro ao processar webhook: ${result.message}`);
            // Ainda responde 200 para não fazer EfiBank reenviar
            res.status(200).json({ 
              received: true,
              processed: false,
              error: result.message,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Handler não disponível, apenas loga
          logger.warn('[WEBHOOK] WebhookHandler não disponível, apenas logando');
          res.status(200).json({ 
            received: true,
            processed: false,
            timestamp: new Date().toISOString(),
            message: 'Webhook recebido mas não processado (serviços não disponíveis)'
          });
        }
      } catch (error: any) {
        logger.error('[WEBHOOK] Erro ao processar webhook:', error);
        // Responde 200 para não fazer EfiBank reenviar em caso de erro interno
        res.status(200).json({ 
          received: true,
          processed: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Rota para testar webhook manualmente
    this.app.post('/webhook/test', (req: Request, res: Response) => {
      logger.info('[WEBHOOK] Teste recebido:', req.body);
      res.json({ message: 'Test webhook received', body: req.body });
    });
  }

  /**
   * Inicia o servidor
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          logger.info(`[WEBHOOK] Servidor webhook iniciado na porta ${this.port}`);
          logger.info(`[WEBHOOK] Endpoints disponíveis:`);
          logger.info(`[WEBHOOK]   - GET  /health`);
          logger.info(`[WEBHOOK]   - POST /webhook/pix`);
          logger.info(`[WEBHOOK]   - POST /webhook/test`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          logger.error('[WEBHOOK] Erro no servidor:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Para o servidor
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('[WEBHOOK] Servidor webhook parado');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Obtém a aplicação Express (para testes)
   */
  getApp(): express.Application {
    return this.app;
  }
}

