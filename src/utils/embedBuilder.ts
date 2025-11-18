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

  embed.setDescription(`💰 **Preço: R$ ${account.price.toFixed(2)}**\n\n**Valorant:**`);

  if (account.account_info) {
    const info = account.account_info;

    if (info.skins_count !== undefined) {
      fields.push({
        name: '🎨 Skins',
        value: `${info.skins_count}`,
        inline: true,
      });
    }

    if (info.valorant_points !== undefined) {
      fields.push({
        name: '🪙 Valorant Points',
        value: `${info.valorant_points} VP`,
        inline: true,
      });
    }

    if (info.inventory_value !== undefined) {
      fields.push({
        name: '💼 Valor Inventário',
        value: `${info.inventory_value} VP`,
        inline: true,
      });
    }

    if (info.recovery_risk) {
      const riskColor = RISK_COLORS[info.recovery_risk] || 0x808080;
      embed.setColor(riskColor);
      
      fields.push({
        name: '⚠️ Risco de Recuperação',
        value: info.recovery_risk,
        inline: true,
      });
    }

    if (info.last_activity) {
      fields.push({
        name: '🕐 Última Atividade',
        value: info.last_activity,
        inline: true,
      });
    }

    if (info.current_rank) {
      const rankEmoji = Object.keys(RANK_EMOJIS).find(r => 
        info.current_rank?.toLowerCase().includes(r.toLowerCase())
      ) || '';
      
      fields.push({
        name: '🛡️ Rank Atual',
        value: `${RANK_EMOJIS[rankEmoji] || '🏆'} ${info.current_rank}`,
        inline: true,
      });
    }

    if (info.email_verified !== undefined) {
      fields.push({
        name: '📧 Email Verificado',
        value: info.email_verified ? '✅ Sim' : '❌ Não',
        inline: true,
      });
    }

    if (info.phone_verified !== undefined) {
      fields.push({
        name: '📱 Telefone Verificado',
        value: info.phone_verified ? '✅ Sim' : '❌ Não',
        inline: true,
      });
    }

    if (info.region) {
      fields.push({
        name: '🌍 Região',
        value: info.region,
        inline: true,
      });
    }
  }

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

  if (account.account_info?.weapon_skins && account.account_info.weapon_skins.length > 0) {
    const skinsList = account.account_info.weapon_skins
      .slice(0, 10)
      .map(skin => `• ${skin.name}`)
      .join('\n');
    
    fields.push({
      name: '🔫 Skins de Armas',
      value: skinsList + (account.account_info.weapon_skins.length > 10 ? '\n...' : ''),
      inline: false,
    });
  }

  embed.addFields(fields);

  return embed;
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

