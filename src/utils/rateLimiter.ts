import Bottleneck from 'bottleneck';

/**
 * Rate limiter para a API LZT Market
 * Limite: 300 requests por minuto (0.2s entre requests)
 */
export const lztRateLimiter = new Bottleneck({
  minTime: 200, // 0.2 segundos entre requests
  maxConcurrent: 1,
  reservoir: 300, // 300 requests
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000, // Recarrega a cada 60 segundos
});

