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
import { createAccountsListEmbed, createAccountEmbed, createAccountEmbeds } from '../utils/embedBuilder';
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

async function renderAccountsList(
  lztService: LZTService,
  filters: LZTSearchFilters,
  interactionOrMessage: ChatInputCommandInteraction | Message,
  cacheService?: any
): Promise<void> {
  
  const channel = interactionOrMessage.channel;
  
  if (!channel) {
    throw new Error('Canal não disponível');
  }

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

    // Filtrar apenas contas publicadas nas últimas 48 horas
    const now = Date.now();
    const maxAge = 48 * 60 * 60 * 1000; // 48 horas em milissegundos
    const recentAccounts = response.items.filter(account => {
      if (!account.published_at) return false;
      const publishedTime = new Date(account.published_at).getTime();
      const age = now - publishedTime;
      return age <= maxAge; // Apenas contas com menos de 48 horas
    });

    if (recentAccounts.length === 0) {
      logger.info('Nenhuma conta recente encontrada (últimas 48h)');
      const content = '❌ Nenhuma conta encontrada publicada nas últimas 48 horas com os filtros especificados.';
      if ('editReply' in interactionOrMessage) {
        await interactionOrMessage.editReply({ content });
      } else {
        await interactionOrMessage.edit({ content });
      }
      return;
    }

    const quantidade = filters.per_page || 10;
    const accountsToShow = recentAccounts.slice(0, Math.min(quantidade, 20));
    
    logger.info(`Filtradas ${recentAccounts.length} contas recentes (últimas 48h) de ${response.items.length} total`);
    
    logger.info(`Preparando para enviar ${accountsToShow.length} conta(s)...`);

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
        
        logger.info(`Criando embeds para conta ${account.item_id}...`);
        const result = await createAccountEmbeds(account, lztService, cacheService);

        // Adicionar footer no primeiro embed (principal)
        result.embeds[0].setFooter({
          text: `Código de Identificação: HYPE_${account.item_id.toString().padStart(6, '0')}`,
        });

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

        logger.info(`Enviando mensagem com ${result.embeds.length} embed(s) para conta ${account.item_id}...`);
        logger.info(`Detalhes dos embeds:`, {
          totalEmbeds: result.embeds.length,
          hasMainEmbed: result.embeds.length > 0,
          hasFiles: !!result.files,
          filesCount: result.files?.length || 0,
        });
        
        try {
          await channel.send({
            embeds: result.embeds,
            files: result.files,
            components: [actionRow],
          });
          logger.info(`✅ Mensagem enviada com sucesso para conta ${account.item_id}`);
        } catch (sendError: any) {
          logger.error(`Erro ao enviar mensagem para conta ${account.item_id}:`, sendError);
          // Tentar enviar apenas o embed principal em caso de erro
          if (result.embeds.length > 0) {
            try {
              await channel.send({
                embeds: [result.embeds[0]],
                components: [actionRow],
              });
              logger.info(`✅ Mensagem enviada com embed principal apenas para conta ${account.item_id}`);
            } catch (fallbackError: any) {
              logger.error(`Erro ao enviar embed principal:`, fallbackError);
            }
          }
        }
        logger.info(`✅ Conta ${account.item_id} enviada com sucesso`);

        if (i < accountsToShow.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (accountError: any) {
        logger.error(`Erro ao processar conta ${account.item_id}:`, accountError);
        logger.error('Stack:', accountError?.stack);
        
        continue;
      }
    }
    
    logger.info('Todas as contas processadas');

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
  lztService: LZTService,
  cacheService?: any
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
    per_page: Math.min(quantidade, 20), 
    // Ordenar por data de publicação descendente (mais recentes primeiro)
    order_by: 'pdate_to_down',
    // Filtros específicos de Valorant: Brasil, região BR, mínimo 3 skins, nível 20+
    country: 'Bra',
    valorant_region: 'BR',
    valorant_smin: 3,
    valorant_level_min: 20,
  };

  if (priceMin) {
    filters.price_min = priceMin;
  }

  if (priceMax) {
    filters.price_max = priceMax;
  }

  await renderAccountsList(lztService, filters, interaction, cacheService);
}

