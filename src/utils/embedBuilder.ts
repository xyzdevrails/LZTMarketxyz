import { EmbedBuilder, ColorResolvable, AttachmentBuilder } from 'discord.js';
import { LZTAccount } from '../types/lzt';
import { logger } from './logger';
import { ValorantApiService } from '../services/valorantApiService';
import { SkinsGridGenerator } from './skinsGridGenerator';
import { SkinsCacheService } from '../services/skinsCacheService';

const RANK_EMOJIS: Record<string, string> = {
  'Ferro': '⚫',
  'Bronze': '🟤',
  'Prata': '⚪',
  'Ouro': '🟡',
  'Platina': '🔵',
  'Diamante': '💎',
  'Ascendente': '🟣',
  'Imortal': '🔴',
  'Radiante': '✨',
};

const RISK_COLORS: Record<string, ColorResolvable> = {
  'Baixo': 0x00ff00,
  'Médio': 0xffaa00,
  'Alto': 0xff0000,
};

export function createAccountEmbed(account: LZTAccount): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🎮 ${account.title}`)
    .setColor(0x5865F2);
  
  if (account.created_at) {
    try {
      const date = new Date(account.created_at);
      if (!isNaN(date.getTime())) {
        embed.setTimestamp(date);
      }
    } catch (error) {
    }
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  // Descrição principal com preço
  embed.setDescription(`💰 **Preço: R$ ${account.price.toFixed(2)}**`);

  if (account.account_info) {
    const info = account.account_info;

    // Primeira linha: Skins, VP, Valor Inventário
    const statsLine: string[] = [];
    
    if (info.skins_count !== undefined) {
      statsLine.push(`🎨 **${info.skins_count}** Skins`);
    }

    if (info.valorant_points !== undefined) {
      statsLine.push(`🪙 **${info.valorant_points}** VP`);
    }

    if (info.inventory_value !== undefined) {
      statsLine.push(`💼 **${info.inventory_value}** VP`);
    }

    if (statsLine.length > 0) {
      fields.push({
        name: '📊 Estatísticas',
        value: statsLine.join(' • '),
        inline: false,
      });
    }

    // Segunda linha: Risco, Atividade, Rank
    const infoLine: string[] = [];

    if (info.recovery_risk) {
      const riskEmoji = info.recovery_risk === 'Alto' ? '🔴' : info.recovery_risk === 'Médio' ? '🟡' : '🟢';
      infoLine.push(`${riskEmoji} Risco: **${info.recovery_risk}**`);
      
      const riskColor = RISK_COLORS[info.recovery_risk] || 0x808080;
      embed.setColor(riskColor);
    }

    if (info.last_activity) {
      infoLine.push(`🕐 **${info.last_activity}**`);
    }

    if (info.current_rank) {
      const rankEmoji = Object.keys(RANK_EMOJIS).find(r => 
        info.current_rank?.toLowerCase().includes(r.toLowerCase())
      ) || '';
      
      infoLine.push(`${RANK_EMOJIS[rankEmoji] || '🛡️'} **${info.current_rank}**`);
    }

    if (infoLine.length > 0) {
      fields.push({
        name: 'ℹ️ Informações',
        value: infoLine.join(' • '),
        inline: false,
      });
    }

    // Terceira linha: Verificações e Região
    const verificationLine: string[] = [];

    if (info.email_verified !== undefined) {
      verificationLine.push(`📧 ${info.email_verified ? '✅' : '❌'} Email`);
    } else if (account.is_email_verified !== undefined) {
      verificationLine.push(`📧 ${account.is_email_verified ? '✅' : '❌'} Email`);
    }

    if (info.phone_verified !== undefined) {
      verificationLine.push(`📱 ${info.phone_verified ? '✅' : '❌'} Telefone`);
    } else if (account.is_phone_verified !== undefined) {
      verificationLine.push(`📱 ${account.is_phone_verified ? '✅' : '❌'} Telefone`);
    }

    if (info.region) {
      verificationLine.push(`🌍 **${info.region}**`);
    } else if (account.riot_country) {
      verificationLine.push(`🌍 **${account.riot_country}**`);
    }

    if (verificationLine.length > 0) {
      fields.push({
        name: '✅ Verificações',
        value: verificationLine.join(' • '),
        inline: false,
      });
    }
  } else {
    // Fallback para dados diretos da conta
    if (account.is_email_verified !== undefined) {
      fields.push({
        name: '📧 Email Verificado',
        value: account.is_email_verified ? '✅ Sim' : '❌ Não',
        inline: true,
      });
    }

    if (account.is_phone_verified !== undefined) {
      fields.push({
        name: '📱 Telefone Verificado',
        value: account.is_phone_verified ? '✅ Sim' : '❌ Não',
        inline: true,
      });
    }
  }

  // Seção de Skins - melhorada para mostrar de forma visual em grid
  if (account.account_info?.weapon_skins && account.account_info.weapon_skins.length > 0) {
    const skins = account.account_info.weapon_skins;
    const skinsCount = account.account_info.skins_count || skins.length;
    
    // Criar grid visual de skins (máximo 15 para não ficar muito longo)
    const displaySkins = skins.slice(0, 15);
    const skinLines: string[] = [];
    
    // Agrupar em linhas de 3 para criar um grid visual (como na imagem)
    for (let i = 0; i < displaySkins.length; i += 3) {
      const lineSkins = displaySkins.slice(i, i + 3);
      const skinNames = lineSkins.map(skin => {
        // Adicionar emoji baseado na raridade se disponível
        const rarityEmoji = getRarityEmoji(skin.rarity);
        // Formatar nome da skin de forma mais compacta
        const shortName = skin.name.length > 20 ? skin.name.substring(0, 17) + '...' : skin.name;
        return `${rarityEmoji} **${shortName}**`;
      }).join('  ');
      skinLines.push(skinNames);
    }
    
    const skinsText = skinLines.join('\n');
    const remainingCount = skins.length > 15 ? `\n\n*... e mais ${skins.length - 15} skin(s)*` : '';
    
    fields.push({
      name: `🔫 Skins de Armas (${skinsCount} total)`,
      value: skinsText + remainingCount,
      inline: false,
    });

    // Usar imagem da primeira skin como imagem principal do embed (mais visível)
    // Se não tiver, usar thumbnail
    if (skins[0]?.image_url) {
      embed.setImage(skins[0].image_url);
    }
    
    // Se tiver segunda skin, usar como thumbnail
    if (skins[1]?.image_url) {
      embed.setThumbnail(skins[1].image_url);
    }
  }

  embed.addFields(fields);

  return embed;
}

// Instância singleton do ValorantApiService para reutilizar cache
let valorantApiService: ValorantApiService | null = null;

function getValorantApiService(): ValorantApiService {
  if (!valorantApiService) {
    valorantApiService = new ValorantApiService();
  }
  return valorantApiService;
}

/**
 * Cria embeds para uma conta, usando múltiplas estratégias para obter imagens de skins:
 * 1. Grid de skins gerado (quando cacheService disponível) - PRIORIDADE ALTA
 * 2. image_url das skins individuais da LZT - FALLBACK 1
 * 3. API valorant-api.com baseada nos nomes das skins - FALLBACK 2
 */
export async function createAccountEmbeds(
  account: LZTAccount,
  lztService?: any,
  cacheService?: SkinsCacheService
): Promise<{ embeds: EmbedBuilder[]; files?: AttachmentBuilder[] }> {
  const embeds: EmbedBuilder[] = [];
  let files: AttachmentBuilder[] | undefined;
  
  // IMPORTANTE: Se account_info não estiver disponível, buscar detalhes completos da conta
  let accountWithDetails = account;
  if (!account.account_info && lztService) {
    try {
      logger.info(`[DEBUG] account_info não disponível, buscando detalhes completos da conta ${account.item_id}...`);
      accountWithDetails = await lztService.getAccountDetails(account.item_id);
      logger.info(`[DEBUG] ✅ Detalhes completos obtidos. account_info existe? ${!!accountWithDetails.account_info}`);
      logger.info(`[DEBUG] weapon_skins existe? ${!!accountWithDetails.account_info?.weapon_skins}`);
      logger.info(`[DEBUG] weapon_skins length: ${accountWithDetails.account_info?.weapon_skins?.length || 0}`);
    } catch (error: any) {
      logger.warn(`[DEBUG] ⚠️ Erro ao buscar detalhes completos da conta:`, error.message);
      // Continuar com os dados originais se falhar
      accountWithDetails = account;
    }
  }

  // ESTRATÉGIA 0: Tentar gerar grid de skins (PRIORIDADE MÁXIMA)
  logger.info(`[DEBUG] Verificando condições para grid: cacheService=${!!cacheService}, weapon_skins=${!!accountWithDetails.account_info?.weapon_skins}, length=${accountWithDetails.account_info?.weapon_skins?.length || 0}`);
  
  if (cacheService && accountWithDetails.account_info?.weapon_skins && accountWithDetails.account_info.weapon_skins.length > 0) {
    try {
      logger.info(`[DEBUG] ✅ Condições atendidas! Tentando gerar grid de skins para conta ${accountWithDetails.item_id}...`);
      const gridResult = await generateSkinsGridEmbed(accountWithDetails, cacheService, lztService);
      
      if (gridResult) {
        logger.info(`[DEBUG] ✅ Grid de skins gerado com sucesso! Retornando grid com ${gridResult.files.length} arquivo(s)`);
        return {
          embeds: [gridResult.embed],
          files: gridResult.files,
        };
      } else {
        logger.warn(`[DEBUG] ⚠️ Grid não pôde ser gerado (retornou null), usando fallback...`);
      }
    } catch (error: any) {
      logger.error(`[DEBUG] ❌ Erro ao gerar grid de skins: ${error.message}`);
      logger.error(`[DEBUG] Stack: ${error.stack}`);
      logger.warn(`[DEBUG] Continuando com estratégias de fallback...`);
    }
  } else {
    if (!cacheService) {
      logger.info(`[DEBUG] ⚠️ cacheService não disponível, pulando grid`);
    }
    if (!accountWithDetails.account_info?.weapon_skins || accountWithDetails.account_info.weapon_skins.length === 0) {
      logger.info(`[DEBUG] ⚠️ Nenhuma skin disponível (weapon_skins=${!!accountWithDetails.account_info?.weapon_skins}, length=${accountWithDetails.account_info?.weapon_skins?.length || 0}), pulando grid`);
    }
  }
  
  // Embed principal com informações da conta (sempre retornar pelo menos este)
  const mainEmbed = createAccountEmbed(accountWithDetails);
  
  // Garantir que o embed principal tenha pelo menos título e descrição
  if (!mainEmbed.data.title) {
    mainEmbed.setTitle(`🎮 ${accountWithDetails.title || 'Conta Valorant'}`);
  }
  if (!mainEmbed.data.description) {
    mainEmbed.setDescription(`💰 **Preço: R$ ${accountWithDetails.price.toFixed(2)}**`);
  }
  
  embeds.push(mainEmbed);

  // Log para debug - verificar estrutura dos dados
  logger.info(`[DEBUG] Criando embeds para conta ${accountWithDetails.item_id}`);
  logger.info(`[DEBUG] account.account_info existe? ${!!accountWithDetails.account_info}`);
  logger.info(`[DEBUG] account.account_info?.weapon_skins existe? ${!!accountWithDetails.account_info?.weapon_skins}`);
  logger.info(`[DEBUG] account.account_info?.weapon_skins length: ${accountWithDetails.account_info?.weapon_skins?.length || 0}`);

  let skinImageUrl: string | null = null;

  // ESTRATÉGIA 1: Usar image_url das skins individuais (se disponível)
  if (!skinImageUrl && accountWithDetails.account_info?.weapon_skins && accountWithDetails.account_info.weapon_skins.length > 0) {
    logger.info(`[DEBUG] Estratégia 2: Tentando usar image_url das skins individuais`);
    const firstSkinWithImage = accountWithDetails.account_info.weapon_skins.find(skin => skin.image_url);
    if (firstSkinWithImage?.image_url) {
      skinImageUrl = firstSkinWithImage.image_url;
      logger.info(`[DEBUG] ✅ Imagem encontrada via image_url da primeira skin: ${skinImageUrl.substring(0, 50)}...`);
    }
  }

  // ESTRATÉGIA 2: Usar API valorant-api.com para buscar imagens baseadas nos nomes das skins
  if (!skinImageUrl) {
    if (accountWithDetails.account_info?.weapon_skins && accountWithDetails.account_info.weapon_skins.length > 0) {
      try {
        logger.info(`[DEBUG] Estratégia 3: Buscando imagens via API valorant-api.com`);
        logger.info(`[DEBUG] Total de skins disponíveis: ${accountWithDetails.account_info.weapon_skins.length}`);
        logger.info(`[DEBUG] Primeiras 3 skins:`, accountWithDetails.account_info.weapon_skins.slice(0, 3).map(s => s.name));
        
        const valorantApi = getValorantApiService();
        
        // Tentar buscar imagem da primeira skin mais importante (geralmente a mais rara ou primeira da lista)
        const skins = accountWithDetails.account_info.weapon_skins;
        
        // Ordenar por raridade (se disponível) ou usar a primeira
        const sortedSkins = [...skins].sort((a, b) => {
          const rarityOrder: Record<string, number> = {
            'exclusive': 5,
            'ultra': 4,
            'premium': 3,
            'deluxe': 3,
            'select': 2,
            'superior': 2,
            'standard': 1,
            'normal': 1,
          };
          
          const aRarity = a.rarity?.toLowerCase() || '';
          const bRarity = b.rarity?.toLowerCase() || '';
          const aOrder = Object.entries(rarityOrder).find(([key]) => aRarity.includes(key))?.[1] || 0;
          const bOrder = Object.entries(rarityOrder).find(([key]) => bRarity.includes(key))?.[1] || 0;
          
          return bOrder - aOrder; // Ordenar do mais raro para o menos raro
        });
        
        logger.info(`[DEBUG] Skins ordenadas por raridade:`, sortedSkins.slice(0, 3).map(s => `${s.name} (${s.rarity || 'N/A'})`));
        
        // Tentar buscar imagem das primeiras 5 skins mais importantes (aumentado de 3 para 5)
        for (const skin of sortedSkins.slice(0, 5)) {
          if (skin.name) {
            logger.info(`[DEBUG] Tentando buscar imagem para skin: "${skin.name}"`);
            const apiImageUrl = await valorantApi.getSkinImage(skin.name);
            if (apiImageUrl) {
              skinImageUrl = apiImageUrl;
              logger.info(`[DEBUG] ✅ Imagem encontrada via valorant-api.com para "${skin.name}": ${skinImageUrl.substring(0, 50)}...`);
              break; // Usar a primeira imagem encontrada
            } else {
              logger.info(`[DEBUG] ❌ Nenhuma imagem encontrada para "${skin.name}"`);
            }
          }
        }
        
        if (!skinImageUrl) {
          logger.warn(`[DEBUG] ❌ Nenhuma imagem encontrada via valorant-api.com para nenhuma das ${sortedSkins.length} skins disponíveis`);
        }
      } catch (error: any) {
        logger.error(`[DEBUG] ❌ Erro ao buscar imagem via valorant-api.com:`, error.message);
        logger.error(`[DEBUG] Stack trace:`, error.stack);
      }
    } else {
      logger.warn(`[DEBUG] Estratégia 3: Não executada - account_info.weapon_skins não disponível ou vazio`);
      logger.info(`[DEBUG] account_info existe? ${!!accountWithDetails.account_info}`);
      logger.info(`[DEBUG] weapon_skins existe? ${!!accountWithDetails.account_info?.weapon_skins}`);
      logger.info(`[DEBUG] weapon_skins length: ${accountWithDetails.account_info?.weapon_skins?.length || 0}`);
    }
  }

  // Adicionar imagem ao embed se encontrada
  if (skinImageUrl) {
    logger.info(`[DEBUG] ✅ Adicionando imagem ao embed principal`);
    mainEmbed.setImage(skinImageUrl);
  } else {
    logger.warn(`[DEBUG] ⚠️ Nenhuma imagem de skin encontrada após todas as estratégias`);
    logger.info(`[DEBUG] Estrutura da conta:`, JSON.stringify({
      item_id: accountWithDetails.item_id,
      has_account_info: !!accountWithDetails.account_info,
      account_info_keys: accountWithDetails.account_info ? Object.keys(accountWithDetails.account_info) : [],
      weapon_skins_count: accountWithDetails.account_info?.weapon_skins?.length || 0,
    }, null, 2));
  }

  // Garantir que sempre retorne pelo menos o embed principal
  if (embeds.length === 0) {
    embeds.push(mainEmbed);
  }

  logger.info(`[DEBUG] Total de embeds criados: ${embeds.length}`);
  return { embeds, files };
}

function getRarityEmoji(rarity?: string): string {
  if (!rarity) return '🔫';
  
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('exclusive') || rarityLower.includes('ultra')) return '💎';
  if (rarityLower.includes('premium') || rarityLower.includes('deluxe')) return '💜';
  if (rarityLower.includes('select') || rarityLower.includes('superior')) return '💙';
  if (rarityLower.includes('standard') || rarityLower.includes('normal')) return '💚';
  
  return '🔫';
}

export function createAccountsListEmbed(
  accounts: LZTAccount[],
  page: number = 1,
  totalPages: number = 1
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Contas de Valorant Disponíveis')
    .setColor(0x5865F2)
    .setTimestamp();

  if (accounts.length === 0) {
    embed.setDescription('❌ Nenhuma conta encontrada.');
    return embed;
  }

  const accountsList = accounts
    .slice(0, 4)
    .map((account, index) => {
      const rank = account.account_info?.current_rank || 'N/A';
      const skins = account.account_info?.skins_count || account.riot_valorant_wallet_vp ? 0 : 0;
      const risk = account.account_info?.recovery_risk || 'N/A';
      const vp = account.riot_valorant_wallet_vp || account.account_info?.valorant_points || 0;
    const inventoryValue = account.account_info?.inventory_value || 0;
    
    let lastActivity = 'N/A';
      if (account.riot_last_activity) {
        lastActivity = new Date(account.riot_last_activity * 1000).toLocaleDateString('pt-BR');
      } else if (account.account_info?.last_activity) {
        lastActivity = account.account_info.last_activity;
      }
      
      const emailVerified = account.riot_email_verified === 1 || account.account_info?.email_verified ? '✅ Sim' : '❌ Não';
    const phoneVerified = account.riot_phone_verified === 1 || account.account_info?.phone_verified ? '✅ Sim' : '❌ Não';
    const region = account.riot_country || account.account_info?.region || 'N/A';
    
    return `**\`HYPE_${account.item_id.toString().padStart(6, '0')}\`** - R$ ${account.price.toFixed(2)}\n` +
             `🎨 ${skins} skins | 🪙 ${vp} VP | 💼 ${inventoryValue} VP\n` +
             `⚠️ Risco: ${risk} | 🕐 ${lastActivity}\n` +
             `🛡️ ${rank} | 📧 ${emailVerified} | 📱 ${phoneVerified} | 🌍 ${region}`;
    })
    .join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

  embed.setDescription(accountsList);

  embed.setFooter({
    text: `Página ${page} de ${totalPages} | Total: ${accounts.length} contas nesta página`,
  });

  return embed;
}

/**
 * Gera embed com grid de skins da conta
 * Retorna objeto com embed e files (attachment) para enviar no Discord
 */
export async function generateSkinsGridEmbed(
  account: LZTAccount,
  cacheService: SkinsCacheService,
  lztService?: any
): Promise<{ embed: EmbedBuilder; files: AttachmentBuilder[] } | null> {
  try {
    logger.info(`[SkinsGridEmbed] Gerando grid de skins para conta ${account.item_id}`);

    // Obter lista de skins da conta
    let accountWithDetails = account;
    if (!account.account_info?.weapon_skins && lztService) {
      try {
        logger.info(`[SkinsGridEmbed] Buscando detalhes completos da conta ${account.item_id}...`);
        accountWithDetails = await lztService.getAccountDetails(account.item_id);
      } catch (error: any) {
        logger.warn(`[SkinsGridEmbed] Erro ao buscar detalhes: ${error.message}`);
      }
    }

    const weaponSkins = accountWithDetails.account_info?.weapon_skins;
    if (!weaponSkins || weaponSkins.length === 0) {
      logger.warn(`[SkinsGridEmbed] Nenhuma skin encontrada para conta ${account.item_id}`);
      return null;
    }

    logger.info(`[SkinsGridEmbed] ${weaponSkins.length} skins encontradas`);

    // Criar gerador de grid
    const gridGenerator = new SkinsGridGenerator(cacheService);

    // Preparar dados das skins
    const skinsData = weaponSkins.map(skin => ({
      name: skin.name,
      rarity: skin.rarity,
      imageUrl: skin.image_url,
    }));

    // Gerar grid
    const gridBuffer = await gridGenerator.generateSkinsGridImage(skinsData);

    if (!gridBuffer) {
      logger.warn(`[SkinsGridEmbed] Não foi possível gerar grid para conta ${account.item_id}`);
      return null;
    }

    // Criar attachment
    const attachment = new AttachmentBuilder(gridBuffer, {
      name: 'skins-grid.png',
      description: `Grid de skins da conta ${account.item_id}`,
    });

    // Criar embed com informações da conta
    const embed = createAccountEmbed(accountWithDetails);

    // Adicionar imagem do grid ao embed
    embed.setImage('attachment://skins-grid.png');

    // Adicionar informações sobre o grid
    const skinsCount = weaponSkins.length;
    const displayedCount = Math.min(skinsCount, 15);
    if (skinsCount > displayedCount) {
      embed.setFooter({
        text: `Mostrando ${displayedCount} de ${skinsCount} skins (ordenadas por raridade)`,
      });
    } else {
      embed.setFooter({
        text: `${skinsCount} skins (ordenadas por raridade)`,
      });
    }

    logger.info(`[SkinsGridEmbed] ✅ Grid gerado com sucesso para conta ${account.item_id}`);

    return {
      embed,
      files: [attachment],
    };
  } catch (error: any) {
    logger.error(`[SkinsGridEmbed] Erro ao gerar grid de skins: ${error.message}`);
    logger.error(`[SkinsGridEmbed] Stack: ${error.stack}`);
    return null;
  }
}

