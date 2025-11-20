import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { LZTAccount } from '../types/lzt';

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
 */
export function createAccountEmbeds(account: LZTAccount): EmbedBuilder[] {
  const embeds: EmbedBuilder[] = [];
  
  // Embed principal com informações da conta
  const mainEmbed = createAccountEmbed(account);
  embeds.push(mainEmbed);

  // Criar embeds adicionais para skins com imagens (máximo 5 para não exceder limite do Discord)
  if (account.account_info?.weapon_skins && account.account_info.weapon_skins.length > 0) {
    const skins = account.account_info.weapon_skins;
    const skinsWithImages = skins.filter(skin => skin.image_url);
    
    // Criar até 5 embeds adicionais com imagens de skins
    const maxSkinEmbeds = Math.min(5, skinsWithImages.length);
    
    for (let i = 0; i < maxSkinEmbeds; i++) {
      const skin = skinsWithImages[i];
      const skinEmbed = new EmbedBuilder()
        .setTitle(`🔫 ${skin.name}`)
        .setImage(skin.image_url || null)
        .setColor(0x5865F2);
      
      if (skin.rarity) {
        const rarityEmoji = getRarityEmoji(skin.rarity);
        skinEmbed.setDescription(`${rarityEmoji} Raridade: **${skin.rarity}**`);
      }
      
      embeds.push(skinEmbed);
    }
    
    // Se houver mais skins sem imagens ou além do limite, criar um embed final com lista
    if (skins.length > maxSkinEmbeds) {
      const remainingSkins = skins.slice(maxSkinEmbeds);
      const remainingText = remainingSkins
        .slice(0, 10)
        .map(skin => {
          const rarityEmoji = getRarityEmoji(skin.rarity);
          return `${rarityEmoji} ${skin.name}`;
        })
        .join('\n');
      
      const remainingCount = skins.length - maxSkinEmbeds;
      const moreText = remainingCount > 10 ? `\n\n*... e mais ${remainingCount - 10} skin(s)*` : '';
      
      const remainingEmbed = new EmbedBuilder()
        .setTitle('🔫 Outras Skins')
        .setDescription(remainingText + moreText)
        .setColor(0x5865F2);
      
      embeds.push(remainingEmbed);
    }
  }

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

