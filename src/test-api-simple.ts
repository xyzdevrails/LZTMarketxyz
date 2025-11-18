import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/logger';

dotenv.config();

async function testSimple() {
  const token = process.env.LZT_API_TOKEN;
  const baseURL = process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market';

  logger.info('Testando autenticação básica...');

  try {
    const response = await axios.get(`${baseURL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info('✅ Autenticação funcionando!');
    logger.info('Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else {
      logger.error('Erro:', error.message);
    }
  }

  logger.info('\nTestando endpoint de categorias...');
  try {
    const categoriesResponse = await axios.get(`${baseURL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info('✅ Categorias obtidas!');
    logger.info('Categorias:', JSON.stringify(categoriesResponse.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else {
      logger.error('Erro:', error.message);
    }
  }
}

testSimple();

