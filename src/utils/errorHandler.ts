import { logger } from './logger';
import { LZTError } from '../types/lzt';

export class LZTAPIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'LZTAPIError';
  }
}

export function handleLZTError(error: any): LZTAPIError {
  if (error.response) {
    const statusCode = error.response.status || 500;
    const errorData: LZTError = error.response.data;

    let code = 'UNKNOWN_ERROR';
    let message = 'Erro desconhecido na API LZT';

    if (errorData?.error) {
      code = errorData.error.code || 'UNKNOWN_ERROR';
      message = errorData.error.message || 'Erro na API LZT';
    }

    switch (statusCode) {
      case 401:
        message = 'Token de autenticação inválido ou expirado';
        break;
      case 403:
        message = 'Sem permissão para acessar este recurso';
        break;
      case 404:
        message = 'Conta não encontrada ou não disponível';
        break;
      case 429:
        message = 'Rate limit excedido. Aguarde um momento.';
        break;
      case 500:
        message = 'Erro interno do servidor LZT';
        break;
      case 502:
      case 503:
      case 504:
        message = 'Servidor LZT temporariamente indisponível';
        break;
    }

    logger.error(`LZT API Error [${statusCode}]: ${code} - ${message}`, error.response.data);

    return new LZTAPIError(statusCode, code, message, error);
  }

  if (error.request) {
    logger.error('Erro de conexão com a API LZT', error.message);
    return new LZTAPIError(0, 'CONNECTION_ERROR', 'Erro ao conectar com a API LZT', error);
  }

  logger.error('Erro desconhecido', error);
  return new LZTAPIError(500, 'UNKNOWN_ERROR', 'Erro desconhecido', error);
}

