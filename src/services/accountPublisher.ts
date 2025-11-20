import { TextChannel, Client } from 'discord.js';
import { LZTService } from './lztService';
import { LZTSearchFilters } from '../types/lzt';
import { createAccountEmbeds } from '../utils/embedBuilder';
import { publishedAccountsStorage } from '../storage/publishedAccounts';
import { logger } from '../utils/logger';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SkinsCacheService } from './skinsCacheService';

export class AccountPublisher {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private client: Client | null = null;
  private channelId: string | null = null;
  private lztService: LZTService;
  private cacheService: SkinsCacheService | null = null;

  constructor(lztService: LZTService, cacheService?: SkinsCacheService) {
    this.lztService = lztService;
    this.cacheService = cacheService || null;
  }

  setCacheService(cacheService: SkinsCacheService): void {
    this.cacheService = cacheService;
  }

  async start(client: Client, channelId: string): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      return { success: false, error: 'Publicação automática já está em execução' };
    }

    const channel = await client.channels.fetch(channelId) as TextChannel;
    if (!channel) {
      return { success: false, error: 'Canal não encontrado' };
    }

    this.client = client;
    this.channelId = channelId;
    this.isRunning = true;

    // Executar imediatamente uma vez
    await this.publishNewAccounts();

    // Configurar intervalo de 1 hora (3600000 ms)
    this.intervalId = setInterval(async () => {
      await this.publishNewAccounts();
    }, 60 * 60 * 1000); // 1 hora

    logger.info(`Publicação automática iniciada no canal ${channelId}`);
    return { success: true };
  }

  stop(): { success: boolean; error?: string } {
    if (!this.isRunning) {
      return { success: false, error: 'Publicação automática não está em execução' };
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.client = null;
    this.channelId = null;

    logger.info('Publicação automática parada');
    return { success: true };
  }

  getStatus(): { isRunning: boolean; channelId: string | null } {
    return {
      isRunning: this.isRunning,
      channelId: this.channelId,
    };
  }

  private async publishNewAccounts(): Promise<void> {
    // Verificar se ainda está rodando antes de executar
    if (!this.isRunning) {
      logger.info('Publicação automática foi parada, cancelando execução...');
      return;
    }

    if (!this.client || !this.channelId) {
      logger.error('Publicação automática: cliente ou canal não configurado');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      if (!channel) {
        logger.error(`Canal ${this.channelId} não encontrado`);
        return;
      }

      logger.info('Buscando novas contas para publicar...');

      const filters: LZTSearchFilters = {
        page: 1,
        per_page: 20,
        order_by: 'pdate_to_down', // Mais recentes primeiro
        country: 'Bra',
        valorant_region: 'BR',
        valorant_smin: 3,
        valorant_level_min: 20,
      };

      const response = await this.lztService.listValorantAccounts(filters);

      if (!response.items || response.items.length === 0) {
        logger.info('Nenhuma conta encontrada para publicar');
        return;
      }

      // Filtrar apenas contas não publicadas e recentes (últimas 48h)
      const now = Date.now();
      const maxAge = 48 * 60 * 60 * 1000; // 48 horas

      const newAccounts = response.items.filter(account => {
        // Verificar se já foi publicada
        if (publishedAccountsStorage.isPublished(account.item_id)) {
          return false;
        }

        // Verificar se é recente (últimas 48h)
        if (account.published_at) {
          const publishedTime = new Date(account.published_at).getTime();
          const age = now - publishedTime;
          if (age > maxAge) {
            return false;
          }
        }

        // Verificar se não foi comprada
        if (account.is_purchased) {
          return false;
        }

        return true;
      });

      if (newAccounts.length === 0) {
        logger.info('Nenhuma conta nova para publicar');
        return;
      }

      logger.info(`Publicando ${newAccounts.length} conta(s) nova(s)...`);

      // Publicar cada conta
      for (const account of newAccounts) {
        // Verificar novamente se ainda está rodando antes de cada publicação
        if (!this.isRunning) {
          logger.info('Publicação automática foi parada durante o loop de publicações');
          break;
        }

        try {
          const result = await createAccountEmbeds(account, this.lztService, this.cacheService || undefined);
          
          // Adicionar footer no primeiro embed (principal)
          result.embeds[0].setFooter({
            text: `Código de Identificação: HYPE_${account.item_id.toString().padStart(6, '0')}`,
          });

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

          const message = await channel.send({
            embeds: result.embeds,
            files: result.files,
            components: [actionRow],
          });

          // Marcar como publicada
          publishedAccountsStorage.markAsPublished(account.item_id, this.channelId, message.id);

          logger.info(`✅ Conta ${account.item_id} publicada com sucesso`);

          // Pequeno delay entre publicações para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          logger.error(`Erro ao publicar conta ${account.item_id}:`, error);
        }
      }

      logger.info(`Publicação automática concluída: ${newAccounts.length} conta(s) publicada(s)`);
    } catch (error: any) {
      logger.error('Erro na publicação automática:', error);
    }
  }
}

