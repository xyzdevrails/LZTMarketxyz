import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';

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

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
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
        
        // Por enquanto, apenas loga e responde 200
        // TODO: Implementar validação e processamento
        
        res.status(200).json({ 
          received: true,
          timestamp: new Date().toISOString(),
          message: 'Webhook recebido com sucesso (processamento será implementado)'
        });
      } catch (error: any) {
        logger.error('[WEBHOOK] Erro ao processar webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
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

