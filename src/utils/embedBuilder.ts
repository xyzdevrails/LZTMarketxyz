import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { LZTAccount } from '../types/lzt';
import { logger } from './logger';

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

/**
 * Cria múltiplos embeds para uma conta, permitindo mostrar várias imagens de skins
 * Retorna array com embed principal + embeds de skins (até 5 imagens)
 * Agora busca imagens através do endpoint /image da API LZT
 */
export async function createAccountEmbeds(
  account: LZTAccount,
  lztService?: any
): Promise<EmbedBuilder[]> {
  const embeds: EmbedBuilder[] = [];
  
  // Embed principal com informações da conta (sempre retornar pelo menos este)
  const mainEmbed = createAccountEmbed(account);
  
  // Garantir que o embed principal tenha pelo menos título e descrição
  if (!mainEmbed.data.title) {
    mainEmbed.setTitle(`🎮 ${account.title || 'Conta Valorant'}`);
  }
  if (!mainEmbed.data.description) {
    mainEmbed.setDescription(`💰 **Preço: R$ ${account.price.toFixed(2)}**`);
  }
  
  embeds.push(mainEmbed);

  // Log para debug - verificar estrutura dos dados
  logger.info(`[DEBUG] Criando embeds para conta ${account.item_id}`);
  logger.info(`[DEBUG] account.account_info existe? ${!!account.account_info}`);
  logger.info(`[DEBUG] account.account_info?.weapon_skins existe? ${!!account.account_info?.weapon_skins}`);
  logger.info(`[DEBUG] account.account_info?.weapon_skins length: ${account.account_info?.weapon_skins?.length || 0}`);
  
  if (account.account_info?.weapon_skins) {
    logger.info(`[DEBUG] Primeira skin:`, JSON.stringify(account.account_info.weapon_skins[0], null, 2));
  }

  // Buscar imagens das skins através do endpoint /image da API LZT
  // SEMPRE tentar buscar imagens, mesmo se account_info não existir
  let skinImages: string[] = [];
  if (lztService) {
    try {
      logger.info(`[DEBUG] Buscando imagens das skins para conta ${account.item_id} através do endpoint /image`);
      const imagesResponse = await lztService.getAccountImages(account.item_id, 'skins');
      skinImages = imagesResponse.images || [];
      logger.info(`[DEBUG] ${skinImages.length} imagem(ns) de skins encontrada(s) do endpoint /image`);
      
      if (skinImages.length > 0) {
        logger.info(`[DEBUG] Primeiras 3 URLs de imagens:`, skinImages.slice(0, 3));
      } else {
        logger.info(`[DEBUG] Nenhuma imagem retornada do endpoint /image`);
      }
    } catch (error: any) {
      logger.error(`[DEBUG] Erro ao buscar imagens das skins:`, error);
      logger.error(`[DEBUG] Detalhes do erro:`, {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });
    }
  } else {
    logger.info(`[DEBUG] lztService não disponível para buscar imagens`);
  }

  // Criar embeds adicionais para skins com imagens (máximo 5 para não exceder limite do Discord)
  // Se tivermos imagens do endpoint /image, criar embeds mesmo sem weapon_skins na resposta
  if (skinImages.length > 0) {
    logger.info(`[DEBUG] Criando ${Math.min(5, skinImages.length)} embed(s) com imagens de skins`);
    
    const maxSkinEmbeds = Math.min(5, skinImages.length);
    
    for (let i = 0; i < maxSkinEmbeds; i++) {
      const imageUrl = skinImages[i];
      if (!imageUrl || imageUrl.trim() === '') continue;
      
      try {
        logger.info(`[DEBUG] Criando embed ${i + 1}/${maxSkinEmbeds} com imagem: ${imageUrl.substring(0, 50)}...`);
        
        const skinEmbed = new EmbedBuilder()
          .setTitle(`🔫 Skin ${i + 1}`)
          .setImage(imageUrl)
          .setColor(0x5865F2)
          .setDescription('Skin de arma da conta');
        
        embeds.push(skinEmbed);
        logger.info(`[DEBUG] Embed de skin ${i + 1} adicionado com sucesso`);
      } catch (error: any) {
        logger.error(`Erro ao criar embed para skin ${i + 1}:`, error);
      }
    }
    
    // Se houver mais imagens além das mostradas, criar um embed informativo
    if (skinImages.length > maxSkinEmbeds) {
      const remainingCount = skinImages.length - maxSkinEmbeds;
      const remainingEmbed = new EmbedBuilder()
        .setTitle('🔫 Mais Skins')
        .setDescription(`*Esta conta possui mais ${remainingCount} skin(s) além das mostradas acima.*`)
        .setColor(0x5865F2);
      
      embeds.push(remainingEmbed);
    }
  } else if (account.account_info?.weapon_skins && account.account_info.weapon_skins.length > 0) {
    // Fallback: usar weapon_skins se disponível (caso raro)
    const skins = account.account_info.weapon_skins;
    logger.info(`[DEBUG] Total de skins encontradas em weapon_skins: ${skins.length}`);
    
    const maxSkinEmbeds = Math.min(5, skins.length);
    
    for (let i = 0; i < maxSkinEmbeds; i++) {
      const skin = skins[i];
      if (!skin) continue;
      
      const imageUrl = skin.image_url;
      if (!imageUrl || imageUrl.trim() === '') continue;
      
      try {
        logger.info(`[DEBUG] Criando embed para skin "${skin.name}" com imagem: ${imageUrl}`);
        
        const skinEmbed = new EmbedBuilder()
          .setTitle(`🔫 ${skin.name}`)
          .setImage(imageUrl)
          .setColor(0x5865F2);
        
        if (skin.rarity) {
          const rarityEmoji = getRarityEmoji(skin.rarity);
          skinEmbed.setDescription(`${rarityEmoji} Raridade: **${skin.rarity}**`);
        } else {
          skinEmbed.setDescription('Skin de arma');
        }
        
        embeds.push(skinEmbed);
        logger.info(`[DEBUG] Embed de skin "${skin.name}" adicionado com sucesso`);
      } catch (error: any) {
        logger.error(`Erro ao criar embed para skin ${skin.name}:`, error);
      }
    }
  } else {
    logger.info(`[DEBUG] Nenhuma imagem encontrada do endpoint /image e nenhuma skin em account.account_info.weapon_skins`);
    logger.info(`[DEBUG] Estrutura completa da conta:`, JSON.stringify({
      item_id: account.item_id,
      has_account_info: !!account.account_info,
      account_info_keys: account.account_info ? Object.keys(account.account_info) : [],
      all_keys: Object.keys(account).slice(0, 10), // Primeiras 10 chaves
    }, null, 2));
  }

  // Garantir que sempre retorne pelo menos o embed principal
  if (embeds.length === 0) {
    embeds.push(mainEmbed);
  }

  logger.info(`[DEBUG] Total de embeds criados: ${embeds.length}`);
  return embeds;
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

