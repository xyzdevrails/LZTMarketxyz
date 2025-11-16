import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  TextChannel,
} from 'discord.js';
import { LZTService } from '../services/lztService';
import { createAccountsListEmbed, createAccountEmbed } from '../utils/embedBuilder';
import { logger } from '../utils/logger';
import { LZTSearchFilters } from '../types/lzt';

export const data = new SlashCommandBuilder()
  .setName('contas')
  .setDescription('Lista contas de Valorant disponíveis')
  .addIntegerOption(option =>
    option
      .setName('quantidade')
      .setDescription('Quantidade de contas para listar (padrão: 10, máximo: 20)')
      .setMinValue(1)
      .setMaxValue(20)
  )
  .addIntegerOption(option =>
    option
      .setName('preco_min')
      .setDescription('Preço mínimo em reais')
      .setMinValue(0)
  )
  .addIntegerOption(option =>
    option
      .setName('preco_max')
      .setDescription('Preço máximo em reais')
      .setMinValue(0)
  );

/**
 * Renderiza contas individuais - uma mensagem por conta
 */
async function renderAccountsList(
  lztService: LZTService,
  filters: LZTSearchFilters,
  interactionOrMessage: ChatInputCommandInteraction | Message
): Promise<void> {
  // Obtém o canal para enviar mensagens
  const channel = interactionOrMessage.channel;
  
  if (!channel) {
    throw new Error('Canal não disponível');
  }
  
  // Verifica se o canal permite envio de mensagens
  if (!('send' in channel)) {
    throw new Error('Canal não permite envio de mensagens');
  }
  try {
    logger.info('Buscando contas com filtros:', filters);
    const response = await lztService.listValorantAccounts(filters);
    logger.info(`Encontradas ${response.items.length} contas`);

    if (!response.items || response.items.length === 0) {
      logger.info('Nenhuma conta encontrada');
      const content = '❌ Nenhuma conta encontrada com os filtros especificados.';
      if ('editReply' in interactionOrMessage) {
        await interactionOrMessage.editReply({ content });
      } else {
        await interactionOrMessage.edit({ content });
      }
      return;
    }

    // Quantidade de contas a mostrar (padrão: 10, máximo: 20)
    const quantidade = filters.per_page || 10;
    const accountsToShow = response.items.slice(0, Math.min(quantidade, 20));
    
    logger.info(`Preparando para enviar ${accountsToShow.length} conta(s)...`);

    // Envia mensagem inicial informando que está carregando
    if ('editReply' in interactionOrMessage) {
      await interactionOrMessage.editReply({
        content: `📦 Carregando ${accountsToShow.length} conta(s)...`,
      });
    } else {
      await interactionOrMessage.edit({
        content: `📦 Carregando ${accountsToShow.length} conta(s)...`,
      });
    }
    
    for (let i = 0; i < accountsToShow.length; i++) {
      const account = accountsToShow[i];
      logger.info(`Processando conta ${i + 1}/${accountsToShow.length}: ${account.item_id}`);
      
      try {
        // Cria embed individual para cada conta
        logger.info(`Criando embed para conta ${account.item_id}...`);
        const embed = createAccountEmbed(account);
        
        // Adiciona código de identificação no footer
        embed.setFooter({
          text: `Código de Identificação: HYPE_${account.item_id.toString().padStart(6, '0')}`,
        });

        // Cria botões de ação para esta conta
        logger.info(`Criando botões para conta ${account.item_id}...`);
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_account_${account.item_id}`)
            .setLabel('🛒 Comprar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`price_display_${account.item_id}`)
            .setLabel(`💰 R$ ${account.price.toFixed(2)}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`view_account_${account.item_id}`)
            .setLabel('ℹ️ Mais Informações')
            .setStyle(ButtonStyle.Secondary)
        );

        // Envia mensagem individual para cada conta
        logger.info(`Enviando mensagem para conta ${account.item_id}...`);
        await channel.send({
          embeds: [embed],
          components: [actionRow],
        });
        logger.info(`✅ Conta ${account.item_id} enviada com sucesso`);

        // Rate limit: espera 200ms entre mensagens para evitar spam
        if (i < accountsToShow.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (accountError: any) {
        logger.error(`Erro ao processar conta ${account.item_id}:`, accountError);
        logger.error('Stack:', accountError?.stack);
        // Continua com a próxima conta mesmo se uma falhar
        continue;
      }
    }
    
    logger.info('Todas as contas processadas');

    // Atualiza mensagem inicial informando conclusão
    const updateContent = `✅ ${accountsToShow.length} conta(s) listada(s) com sucesso!`;
    
    if ('editReply' in interactionOrMessage) {
      await interactionOrMessage.editReply({
        content: updateContent,
      });
    } else {
      await interactionOrMessage.edit({
        content: updateContent,
      });
    }

  } catch (error: any) {
    logger.error('=== ERRO AO RENDERIZAR LISTA DE CONTAS ===');
    logger.error('Tipo do erro:', typeof error);
    logger.error('Erro é objeto?', error instanceof Object);
    logger.error('Erro é Error?', error instanceof Error);
    
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error name:', error.name);
      logger.error('Error stack:', error.stack);
    } else if (error && typeof error === 'object') {
      logger.error('Error keys:', Object.keys(error));
      logger.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } else {
      logger.error('Error value:', error);
      logger.error('Error toString:', String(error));
    }
    
    const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
    const errorContent = `❌ Erro ao buscar contas: ${errorMessage}`;
    
    try {
      if ('editReply' in interactionOrMessage) {
        await interactionOrMessage.editReply({ content: errorContent });
      } else {
        await interactionOrMessage.edit({ content: errorContent });
      }
    } catch (replyError: any) {
      logger.error('Erro ao enviar mensagem de erro', replyError);
      logger.error('Reply error stack:', replyError?.stack);
    }
  }
}

export async function execute(
  interaction: ChatInputCommandInteraction,
  lztService: LZTService
): Promise<void> {
  logger.info(`Executando comando /contas para usuário ${interaction.user.tag}`);
  
  try {
    await interaction.deferReply();
  } catch (error: any) {
    logger.error('Erro ao fazer deferReply', error);
    try {
      await interaction.reply({
        content: '❌ Erro ao processar comando. Verifique as permissões do bot.',
        ephemeral: true,
      });
    } catch (replyError) {
      logger.error('Erro ao enviar resposta de erro', replyError);
    }
    return;
  }

  const quantidade = interaction.options.getInteger('quantidade') || 10;
  const priceMin = interaction.options.getInteger('preco_min');
  const priceMax = interaction.options.getInteger('preco_max');

  const filters: LZTSearchFilters = {
    page: 1,
    per_page: Math.min(quantidade, 20), // Máximo 20 contas
    order_by: 'price_to_up',
  };

  if (priceMin) {
    filters.price_min = priceMin;
  }

  if (priceMax) {
    filters.price_max = priceMax;
  }

  await renderAccountsList(lztService, filters, interaction);
}

// Função de navegação removida - não há mais paginação

