import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/logger';

dotenv.config();

async function testValorantEndpoint() {
  const token = process.env.LZT_API_TOKEN;
  const baseURLs = [
    'https://api.lzt.market',
    'https://prod-api.lzt.market',
  ];

  const endpoints = [
    '/valorant',
    '/market/valorant',
    '/13', // category ID
  ];

  for (const baseURL of baseURLs) {
    logger.info(`\n=== Testando base URL: ${baseURL} ===`);
    
    for (const endpoint of endpoints) {
      logger.info(`\nTestando: ${endpoint}`);
      try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: { per_page: 1 },
          timeout: 30000,
        });

        logger.info(`✅ ${baseURL}${endpoint} FUNCIONOU!`);
        logger.info(`Status: ${response.status}`);
        if (response.data) {
          const dataStr = JSON.stringify(response.data).substring(0, 1000);
          logger.info(`Resposta: ${dataStr}...`);
        }
        return; // Se funcionou, para aqui
      } catch (error: any) {
        if (error.response) {
          logger.info(`❌ Status: ${error.response.status}`);
        } else {
          logger.info(`❌ Erro: ${error.message}`);
        }
      }
    }
  }
}

testValorantEndpoint();

