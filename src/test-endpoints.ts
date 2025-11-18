import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/logger';

dotenv.config();

async function testEndpoints() {
  const token = process.env.LZT_API_TOKEN;
  const baseURL = process.env.LZT_API_BASE_URL || 'https:

  const endpoints = [
    '/market',
    '/market/riot',
    '/market/category/riot',
    '/market/category-search',
    '/categories',
    '/market/user/accounts',
  ];

  for (const endpoint of endpoints) {
    logger.info(`\nTestando: ${endpoint}`);
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: endpoint.includes('market') ? { per_page: 1 } : {},
        timeout: 30000,
      });

      logger.info(`✅ ${endpoint} funcionou!`);
      logger.info(`Status: ${response.status}`);
      if (response.data) {
        const dataStr = JSON.stringify(response.data).substring(0, 500);
        logger.info(`Resposta (primeiros 500 chars): ${dataStr}...`);
      }
    } catch (error: any) {
      if (error.response) {
        logger.info(`❌ ${endpoint} - Status: ${error.response.status}`);
        if (error.response.status !== 404) {
          logger.info(`Resposta: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        }
      } else {
        logger.info(`❌ ${endpoint} - Erro: ${error.message}`);
      }
    }
  }
}

testEndpoints();

