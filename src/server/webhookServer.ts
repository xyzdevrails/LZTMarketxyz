import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { WebhookHandler } from '../handlers/webhookHandler';
import { BalanceService } from '../services/balanceService';
import { Client } from 'discord.js';

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
    
    if (balanceService && discordClient) {
      this.webhookHandler = new WebhookHandler(balanceService, discordClient);
      logger.info('[WEBHOOK] WebhookHandler inicializado com sucesso');
    } else {
      logger.warn('[WEBHOOK] WebhookHandler não inicializado (serviços não disponíveis)');
    }
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    
    this.app.use((req: Request, res: Response, next) => {
      logger.info(`[WEBHOOK] ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'webhook-server' });
    });

    this.app.post('/webhook/pix', async (req: Request, res: Response) => {
      try {
        // Valida IP da EfiBank (quando usando skip-mTLS)
        const clientIp = req.ip || req.socket.remoteAddress || '';
        const efibankIp = '34.193.116.226';
        
        // Se não for do IP da EfiBank, rejeita (mas loga para debug)
        if (!clientIp.includes(efibankIp) && process.env.WEBHOOK_VALIDATE_IP !== 'false') {
          logger.warn(`[WEBHOOK] ⚠️ Requisição rejeitada - IP não autorizado: ${clientIp}`);
          logger.warn(`[WEBHOOK] IP esperado da EfiBank: ${efibankIp}`);
          logger.warn(`[WEBHOOK] Para desabilitar validação de IP, configure WEBHOOK_VALIDATE_IP=false`);
          return res.status(403).json({ 
            error: 'IP não autorizado',
            received_ip: clientIp,
            expected_ip: efibankIp
          });
        }
        
        logger.info('[WEBHOOK] ========================================');
        logger.info('[WEBHOOK] Recebido webhook PIX');
        logger.info('[WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
        logger.info('[WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
        logger.info('[WEBHOOK] IP:', clientIp);
        logger.info('[WEBHOOK] ========================================');
        
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
            res.status(200).json({ 
              received: true,
              processed: false,
              error: result.message,
              timestamp: new Date().toISOString()
            });
          }
        } else {
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
        res.status(200).json({ 
          received: true,
          processed: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.post('/webhook/test', (req: Request, res: Response) => {
      logger.info('[WEBHOOK] Teste recebido:', req.body);
      res.json({ message: 'Test webhook received', body: req.body });
    });
  }

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

  getApp(): express.Application {
    return this.app;
  }
}

