import dotenv from 'dotenv';
import { LZTService } from './services/lztService';
import { logger } from './utils/logger';

// Carrega variáveis de ambiente
dotenv.config();

async function listAccounts() {
  if (!process.env.LZT_API_TOKEN) {
    logger.error('LZT_API_TOKEN não encontrado no .env');
    process.exit(1);
  }

  const lztService = new LZTService(
    process.env.LZT_API_TOKEN,
    process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'
  );

  logger.info('🔍 Buscando contas de Valorant...\n');

  try {
    const response = await lztService.listValorantAccounts({
      per_page: 10,
      order_by: 'price_to_up', // Do mais barato para o mais caro
    });

    logger.info(`✅ Encontradas ${response.items.length} contas (de ${response.totalItems} total)\n`);
    logger.info('═'.repeat(80));

    response.items.forEach((account, index) => {
      logger.info(`\n📦 Conta #${index + 1}`);
      logger.info(`   ID: ${account.item_id}`);
      logger.info(`   Título: ${account.title}`);
      logger.info(`   Preço: R$ ${account.price.toFixed(2)}`);
      
      if (account.riot_valorant_wallet_vp !== undefined) {
        logger.info(`   Valorant Points: ${account.riot_valorant_wallet_vp} VP`);
      }
      
      if (account.riot_last_activity) {
        const lastActivity = new Date(account.riot_last_activity * 1000).toLocaleDateString('pt-BR');
        logger.info(`   Última Atividade: ${lastActivity}`);
      }
      
      if (account.riot_email_verified !== undefined) {
        logger.info(`   Email Verificado: ${account.riot_email_verified ? '✅ Sim' : '❌ Não'}`);
      }
      
      if (account.riot_phone_verified !== undefined) {
        logger.info(`   Telefone Verificado: ${account.riot_phone_verified ? '✅ Sim' : '❌ Não'}`);
      }
      
      if (account.riot_country) {
        logger.info(`   País: ${account.riot_country}`);
      }
      
      logger.info(`   Estado: ${account.item_state || 'N/A'}`);
      logger.info(`   Link: https://lzt.market/${account.item_id}`);
      
      if (index < response.items.length - 1) {
        logger.info('   ' + '-'.repeat(76));
      }
    });

    logger.info('\n' + '═'.repeat(80));
    logger.info(`\n📊 Paginação:`);
    logger.info(`   Página atual: ${response.page || 1}`);
    logger.info(`   Itens por página: ${response.perPage || 40}`);
    logger.info(`   Total de itens: ${response.totalItems}`);
    logger.info(`   Tem próxima página: ${response.hasNextPage ? '✅ Sim' : '❌ Não'}`);
    
    logger.info('\n✅ Listagem concluída!');
  } catch (error: any) {
    logger.error('❌ Erro ao buscar contas:', error);
    if (error.statusCode) {
      logger.error(`Status Code: ${error.statusCode}`);
      logger.error(`Mensagem: ${error.message}`);
    }
    process.exit(1);
  }
}

listAccounts();

