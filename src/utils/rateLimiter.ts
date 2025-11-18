import Bottleneck from 'bottleneck';

export const lztRateLimiter = new Bottleneck({
  minTime: 200,
  maxConcurrent: 1,
  reservoir: 300,
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000,
});

