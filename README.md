# Bot Discord - Vendas de Contas Valorant via LZT Market

Bot do Discord que integra com a API do LZT Market para listar e vender contas de Valorant. Os clientes podem visualizar cards com informações detalhadas (skins, rank, risco, etc.) e comprar diretamente pelo bot, recebendo os dados da conta via DM após pagamento manual.

## 🚀 Funcionalidades

- ✅ Listar contas de Valorant disponíveis no LZT Market
- ✅ Visualizar detalhes completos de cada conta (skins, rank, risco, etc.)
- ✅ Sistema de compra com confirmação manual de pagamento
- ✅ Entrega automática de credenciais via DM
- ✅ Rate limiting automático (300 req/min)
- ✅ Sistema de pedidos com storage em JSON
- ✅ Comandos administrativos para gerenciar pedidos

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Token do bot Discord
- Token da API LZT Market com scope `market`
- Acesso à API Market do LZT (200 sympathies ou assinatura mensal)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd lztmarkethype
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione:
```
DISCORD_BOT_TOKEN=seu_token_discord_aqui
LZT_API_TOKEN=seu_token_lzt_aqui
LZT_API_BASE_URL=https://prod-api.lzt.market
```

## 🎮 Comandos Disponíveis

### Para Usuários

- `/contas` - Lista contas de Valorant disponíveis
  - Opções: `pagina`, `preco_min`, `preco_max`
- `/conta <id>` - Mostra detalhes de uma conta específica

### Para Administradores

- `/admin confirmar-pagamento <pedido_id>` - Confirma um pagamento e processa a compra
- `/admin pedidos-pendentes` - Lista todos os pedidos pendentes

## 🔄 Fluxo de Compra

1. Usuário executa `/contas` → Bot busca contas na API LZT
2. Bot exibe cards com botões interativos
3. Usuário clica "Comprar" → Bot registra pedido pendente
4. Usuário preenche modal com comprovante de pagamento
5. Admin confirma pagamento via `/admin confirmar-pagamento`
6. Bot executa compra na API LZT
7. Bot obtém credenciais da conta
8. Bot envia DM ao cliente com dados da conta
9. Pedido marcado como concluído

## 🏃 Executando o Bot

### Modo Desenvolvimento
```bash
npm run dev
```

### Build e Produção
```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── commands/          # Comandos slash do Discord
│   ├── contas.ts     # Listar contas
│   ├── conta.ts      # Detalhes de conta
│   └── admin.ts      # Comandos administrativos
├── handlers/          # Handlers de interações
│   ├── buttonHandler.ts
│   └── modalHandler.ts
├── services/          # Serviços de negócio
│   ├── lztService.ts      # Cliente da API LZT
│   └── purchaseService.ts # Lógica de compra
├── storage/          # Sistema de storage
│   └── orders.ts     # Gerenciamento de pedidos
├── types/            # Tipos TypeScript
│   └── lzt.ts        # Tipos da API LZT
├── utils/            # Utilitários
│   ├── embedBuilder.ts   # Builder de embeds
│   ├── rateLimiter.ts    # Rate limiting
│   ├── logger.ts         # Sistema de logs
│   └── errorHandler.ts   # Tratamento de erros
└── index.ts          # Entry point do bot
```

## 🔐 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- Mantenha seus tokens seguros
- Use permissões adequadas no Discord (apenas admins podem usar `/admin`)
- O arquivo `orders.json` contém informações sensíveis - mantenha seguro

## 📚 Documentação da API

- [LZT Market API Documentation](https://lzt-market.readme.io/reference/information)
- [Discord.js Documentation](https://discord.js.org/)

## 🐛 Troubleshooting

### Bot não responde aos comandos
- Verifique se o token do Discord está correto
- Certifique-se de que o bot tem as permissões necessárias no servidor
- Verifique os logs para erros

### Erro 401 ao acessar API LZT
- Verifique se o token LZT está correto
- Confirme que o token tem o scope `market`
- Aguarde 24h após adquirir acesso à API Market

### Erro 429 (Rate Limit)
- O bot já tem rate limiting implementado
- Se ainda assim ocorrer, aumente o `minTime` no `rateLimiter.ts`

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

