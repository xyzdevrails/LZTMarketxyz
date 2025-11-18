import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { BalanceService } from '../services/balanceService';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('meusaldo')
  .setDescription('Verifica seu saldo atual na conta');

export async function execute(
  interaction: ChatInputCommandInteraction,
  balanceService: BalanceService
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    const userId = interaction.user.id;
    const balance = balanceService.getUserBalance(userId);

    const { userBalancesStorage } = await import('../storage/userBalances');
    const recentTransactions = userBalancesStorage.getTransactions(userId, 5);

    const embed = new EmbedBuilder()
      .setTitle('💰 Seu Saldo')
      .setColor(0x00ff00)
      .setDescription(`**Saldo Atual:** R$ ${balance.toFixed(2)}`)
      .setTimestamp();

    if (recentTransactions.length > 0) {
      const transactionsList = recentTransactions
        .slice(0, 5)
        .map(t => {
          const emoji = t.type === 'credit' ? '➕' : '➖';
          const date = new Date(t.created_at).toLocaleDateString('pt-BR');
          return `${emoji} R$ ${Math.abs(t.amount).toFixed(2)} - ${t.description} (${date})`;
        })
        .join('\n');

      embed.addFields({
        name: '📜 Últimas Transações',
        value: transactionsList || 'Nenhuma transação ainda',
        inline: false,
      });
    } else {
      embed.addFields({
        name: '💡 Dica',
        value: 'Use `/adicionarsaldo` para adicionar saldo à sua conta via PIX!',
        inline: false,
      });
    }

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info(`Saldo consultado por ${interaction.user.tag} (${userId}): R$ ${balance.toFixed(2)}`);
  } catch (error: any) {
    logger.error('Erro ao consultar saldo', error);
    await interaction.editReply({
      content: `❌ Erro ao consultar saldo: ${error.message || 'Erro desconhecido'}`,
    });
  }
}

