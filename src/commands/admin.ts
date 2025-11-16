import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { PurchaseService } from '../services/purchaseService';
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
}

