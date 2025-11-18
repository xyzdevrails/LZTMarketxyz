import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { PurchaseService } from '../services/purchaseService';
import { pixTransactionsStorage } from '../storage/pixTransactions';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Comandos administrativos do bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('confirmar-pagamento')
      .setDescription('Confirma um pagamento e processa a compra')
      .addStringOption(option =>
        option
          .setName('pedido_id')
          .setDescription('ID do pedido a ser confirmado')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('pedidos-pendentes')
      .setDescription('Lista todos os pedidos pendentes')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('transacoes-pix')
      .setDescription('Lista transações PIX (pendentes ou todas)')
      .addStringOption(option =>
        option
          .setName('status')
          .setDescription('Filtrar por status')
          .addChoices(
            { name: 'Todas', value: 'all' },
            { name: 'Pendentes', value: 'pending' },
            { name: 'Pagas', value: 'paid' }
          )
          .setRequired(false)
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  purchaseService: PurchaseService
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'confirmar-pagamento') {
    const orderId = interaction.options.getString('pedido_id', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await purchaseService.confirmPurchase(orderId);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ Erro ao confirmar pagamento: ${result.error}`,
        });
        return;
      }

      // Envia DM ao cliente com os dados da conta
      if (result.accountData && result.order) {
        const user = await interaction.client.users.fetch(result.order.user_id);

        const credentialsMessage = `🎮 **Conta Comprada com Sucesso!**\n\n` +
          `**ID do Pedido:** \`${orderId}\`\n\n` +
          `**Credenciais da Conta:**\n` +
          `\`\`\`\n` +
          `${result.accountData.login ? `Login: ${result.accountData.login}\n` : ''}` +
          `${result.accountData.password ? `Senha: ${result.accountData.password}\n` : ''}` +
          `${result.accountData.email ? `Email: ${result.accountData.email}\n` : ''}` +
          `${result.accountData.email_password ? `Senha do Email: ${result.accountData.email_password}\n` : ''}` +
          `${result.accountData.phone ? `Telefone: ${result.accountData.phone}\n` : ''}` +
          `${result.accountData.recovery_codes ? `Códigos de Recuperação:\n${result.accountData.recovery_codes.join('\n')}\n` : ''}` +
          `\`\`\`\n\n` +
          `⚠️ **Importante:** Guarde essas informações em local seguro!`;

        try {
          await user.send(credentialsMessage);
          await interaction.editReply({
            content: `✅ Pagamento confirmado e conta entregue via DM ao cliente!`,
          });
        } catch (dmError) {
          logger.error('Erro ao enviar DM', dmError);
          await interaction.editReply({
            content: `✅ Pagamento confirmado, mas não foi possível enviar DM ao cliente.\n\n` +
                     `**Credenciais:**\n\`\`\`\n${JSON.stringify(result.accountData, null, 2)}\`\`\``,
          });
        }
      } else {
        await interaction.editReply({
          content: `✅ Pagamento confirmado, mas não foi possível obter os dados da conta.`,
        });
      }
    } catch (error: any) {
      logger.error('Erro ao confirmar pagamento', error);
      await interaction.editReply({
        content: `❌ Erro ao processar: ${error.message}`,
      });
    }
    return;
  }

  if (subcommand === 'pedidos-pendentes') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { orderStorage } = await import('../storage/orders');
      const pendingOrders = orderStorage.getAllPendingOrders();

      if (pendingOrders.length === 0) {
        await interaction.editReply({
          content: '✅ Nenhum pedido pendente no momento.',
        });
        return;
      }

      const ordersList = pendingOrders
        .map(order => {
          const date = new Date(order.created_at).toLocaleString('pt-BR');
          return `**${order.order_id}** - ${order.username} (${order.user_id})\n` +
                 `💰 R$ ${order.price.toFixed(2)} | 📅 ${date}`;
        })
        .join('\n\n');

      await interaction.editReply({
        content: `📋 **Pedidos Pendentes (${pendingOrders.length}):**\n\n${ordersList}`,
      });
    } catch (error: any) {
      logger.error('Erro ao listar pedidos', error);
      await interaction.editReply({
        content: `❌ Erro ao listar pedidos: ${error.message}`,
      });
    }
    return;
  }

  if (subcommand === 'transacoes-pix') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const statusFilter = interaction.options.getString('status') || 'all';
      
      // Obtém todas as transações do storage
      const allTransactions = pixTransactionsStorage.getAllTransactions();
      
      let transactions = allTransactions;
      
      if (statusFilter !== 'all') {
        transactions = allTransactions.filter(t => t.status === statusFilter);
      }

      if (transactions.length === 0) {
        await interaction.editReply({
          content: `✅ Nenhuma transação PIX encontrada${statusFilter !== 'all' ? ` com status "${statusFilter}"` : ''}.\n\n` +
                   `💡 **Nota:** O arquivo \`pix_transactions.json\` fica no servidor (Railway).\n` +
                   `Use este comando para visualizar as transações diretamente no Discord.`,
        });
        return;
      }

      // Ordena por data (mais recente primeiro)
      transactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Limita a 10 transações para não exceder limite do embed
      const transactionsToShow = transactions.slice(0, 10);

      const embed = new EmbedBuilder()
        .setTitle(`💳 Transações PIX (${transactions.length} total)`)
        .setColor(0x00ff00)
        .setDescription(
          transactionsToShow.map(t => {
            const date = new Date(t.created_at).toLocaleString('pt-BR');
            const statusEmoji: Record<string, string> = {
              'pending': '⏳',
              'paid': '✅',
              'expired': '❌',
              'cancelled': '🚫'
            };
            const emoji = statusEmoji[t.status] || '❓';
            
            return `${emoji} **${t.transaction_id}**\n` +
                   `👤 <@${t.user_id}> | 💰 R$ ${t.amount.toFixed(2)}\n` +
                   `📅 ${date} | Status: ${t.status}`;
          }).join('\n\n')
        )
        .setTimestamp();

      if (transactions.length > 10) {
        embed.setFooter({ text: `Mostrando 10 de ${transactions.length} transações` });
      }

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error: any) {
      logger.error('Erro ao listar transações PIX', error);
      await interaction.editReply({
        content: `❌ Erro ao listar transações: ${error.message}`,
      });
    }
    return;
  }
}

