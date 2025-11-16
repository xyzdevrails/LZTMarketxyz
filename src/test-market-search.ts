import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/logger';

dotenv.config();

async function testMarketSearch() {
  const token = process.env.LZT_API_TOKEN;
  const baseURL = process.env.LZT_API_BASE_URL || 'https://api.lzt.market';

  // Endpoints possíveis para buscar contas no mercado
  const endpoints = [
    { url: '/', params: {} },
    { url: '/', params: { category_id: 13 } }, // Valorant category ID
    { url: '/', params: { game_id: 13 } },
    { url: '/market', params: {} },
    { url: '/market', params: { category_id: 13 } },
    { url: '/market', params: { category: 'valorant' } },
  ];

  for (const { url, params } of endpoints) {
    logger.info(`\nTestando: ${url} com params: ${JSON.stringify(params)}`);
    try {
      const response = await axios.get(`${baseURL}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { ...params, per_page: 1 },
        timeout: 30000,
      });

      logger.info(`✅ ${url} FUNCIONOU!`);
      logger.info(`Status: ${response.status}`);
      const dataStr = JSON.stringify(response.data).substring(0, 1000);
      logger.info(`Resposta: ${dataStr}...`);
      
      // Se encontrou items, para aqui
      if (response.data?.items && response.data.items.length > 0) {
        logger.info(`\n🎉 Encontrou ${response.data.items.length} conta(s)!`);
        return;
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status !== 404) {
          logger.info(`❌ Status: ${error.response.status}`);
          logger.info(`Resposta: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        }
      }
    }
  }
}

testMarketSearch();

