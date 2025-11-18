import dotenv from 'dotenv';
import { LZTService } from './services/lztService';
import { logger } from './utils/logger';

dotenv.config();

async function testAPI() {
  if (!process.env.LZT_API_TOKEN) {
    logger.error('LZT_API_TOKEN não encontrado no .env');
    process.exit(1);
  }

  const lztService = new LZTService(
    process.env.LZT_API_TOKEN,
    process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'
  );

  logger.info('Testando conexão com a API LZT Market...');

  try {
    
    logger.info('Buscando contas de Valorant...');
    const response = await lztService.listValorantAccounts({
      per_page: 5,
      order_by: 'price_to_up', 
    });

    logger.info(`✅ Sucesso! Encontradas ${response.items.length} contas`);
    
    if (response.items.length > 0) {
      const firstAccount = response.items[0];
      logger.info(`\nPrimeira conta encontrada:`);
      logger.info(`- ID: ${firstAccount.item_id}`);
      logger.info(`- Título: ${firstAccount.title}`);
      logger.info(`- Preço: R$ ${firstAccount.price.toFixed(2)}`);
      logger.info(`- Categoria: ${firstAccount.category?.category_name || 'N/A'}`);
      logger.info(`- Jogo: ${firstAccount.game?.game_name || 'N/A'}`);
    }

    logger.info(`\n📊 Paginação:`);
    if (response.pagination) {
      logger.info(`- Página atual: ${response.pagination.current_page}`);
      logger.info(`- Total de páginas: ${response.pagination.total_pages}`);
      logger.info(`- Total de itens: ${response.pagination.total}`);
    } else {
      logger.info(`- Estrutura de paginação: ${JSON.stringify(Object.keys(response))}`);
    }

    logger.info('\n✅ API funcionando corretamente!');
  } catch (error: any) {
    logger.error('❌ Erro ao testar API:', error);
    if (error.statusCode) {
      logger.error(`Status Code: ${error.statusCode}`);
      logger.error(`Mensagem: ${error.message}`);
    }
    process.exit(1);
  }
}

testAPI();

