import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/logger';

dotenv.config();

async function testUserAccounts() {
  const token = process.env.LZT_API_TOKEN;
  const baseURL = process.env.LZT_API_BASE_URL || 'https:

  logger.info('Obtendo informações do usuário...');
  try {
    const userResponse = await axios.get(`${baseURL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const userData = typeof userResponse.data === 'string' 
      ? JSON.parse(userResponse.data) 
      : userResponse.data;
    
    const userId = userData.user?.user_id;
    logger.info(`User ID: ${userId}`);

    if (userId) {
      
      const endpoints = [
        `/user/${userId}/items`,
        `/market/user/${userId}/items`,
        `/market/user/accounts`,
      ];

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

          logger.info(`✅ ${endpoint} FUNCIONOU!`);
          logger.info(`Status: ${response.status}`);
          logger.info(`Resposta: ${JSON.stringify(response.data).substring(0, 500)}`);
          return;
        } catch (error: any) {
          if (error.response) {
            logger.info(`❌ Status: ${error.response.status}`);
            if (error.response.status !== 404) {
              logger.info(`Resposta: ${JSON.stringify(error.response.data).substring(0, 200)}`);
            }
          }
        }
      }
    }
  } catch (error: any) {
    logger.error('Erro:', error.message);
  }
}

testUserAccounts();

