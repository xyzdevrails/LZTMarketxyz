# Bot Discord - Vendas de Contas Valorant via LZT Market

Bot do Discord que integra com a API do LZT Market para listar e vender contas de Valorant. Os clientes podem visualizar cards com informações detalhadas (skins, rank, risco, etc.) e comprar diretamente pelo bot, recebendo os dados da conta via DM após pagamento.

## 🚀 Funcionalidades

### Core
- ✅ Listar contas de Valorant disponíveis no LZT Market
- ✅ Visualizar detalhes completos de cada conta (skins, rank, risco, etc.)
- ✅ Sistema de compra com entrega automática de credenciais via DM
- ✅ Rate limiting automático (300 req/min)
- ✅ Sistema de pedidos com storage em JSON

### Sistema de Pagamento PIX
- ✅ Integração completa com EfiBank
- ✅ Geração automática de QR Code PIX
- ✅ Webhook automático para confirmação de pagamentos
- ✅ Adição automática de saldo após pagamento confirmado
- ✅ Notificação via DM quando saldo é adicionado
- ✅ Sistema de saldo por usuário

### Comandos Administrativos
- ✅ Gerenciamento completo de pedidos
- ✅ Histórico de transações PIX
- ✅ Liberação manual de saldo
- ✅ Visualização de detalhes de transações

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Token do bot Discord
- Token da API LZT Market com scope `market`
- Acesso à API Market do LZT (200 sympathies ou assinatura mensal)
- Conta EfiBank com certificado PIX configurado
- Chave PIX (e-mail, CPF ou CNPJ)

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
# Discord
DISCORD_BOT_TOKEN=seu_token_discord_aqui

# LZT Market
LZT_API_TOKEN=seu_token_lzt_aqui
LZT_API_BASE_URL=https://prod-api.lzt.market

# EfiBank (PIX)
EFI_CLIENT_ID=seu_client_id_efibank
EFI_CLIENT_SECRET=seu_client_secret_efibank
EFI_PIX_KEY=sua_chave_pix@email.com
EFI_SANDBOX=false
EFI_CERT_BASE64=certificado_base64_aqui

# Webhook
WEBHOOK_PORT=3000
WEBHOOK_URL=https://seu-dominio.com
WEBHOOK_VALIDATE_IP=true
```

## 🎮 Comandos Disponíveis

### Para Usuários

- `/contas` - Lista contas de Valorant disponíveis
  - Opções: `quantidade` (1-20), `preco_min`, `preco_max`
- `/conta <id>` - Mostra detalhes de uma conta específica
- `/adicionarsaldo <valor>` - Adiciona saldo à conta via PIX
  - Gera QR Code PIX automaticamente
  - Valor mínimo: R$ 1,00
- `/meusaldo` - Consulta saldo atual e histórico de transações

### Para Administradores

- `/admin finalizar-compra <pedido_id>` - Finaliza compra e entrega conta ao cliente
- `/admin compras-pendentes` - Lista todos os pedidos pendentes
- `/admin historico-pix [status]` - Lista histórico de transações PIX
  - Status: `all`, `pending`, `paid`
- `/admin detalhes-pix <transaction_id>` - Visualiza detalhes de uma transação PIX
- `/admin liberar-saldo <transaction_id>` - Confirma pagamento PIX e libera saldo manualmente

## 🔄 Fluxos do Sistema

### Fluxo de Compra de Conta

1. Usuário executa `/contas` → Bot busca contas na API LZT
2. Bot exibe cards com botões interativos
3. Usuário clica "Comprar" → Bot registra pedido pendente
4. Usuário preenche modal com comprovante de pagamento
5. Admin confirma pagamento via `/admin finalizar-compra`
6. Bot executa compra na API LZT
7. Bot obtém credenciais da conta
8. Bot envia DM ao cliente com dados da conta
9. Pedido marcado como concluído

### Fluxo de Adição de Saldo via PIX

1. Usuário executa `/adicionarsaldo <valor>`
2. Bot valida valor (mínimo R$ 1,00)
3. Bot cria cobrança PIX na EfiBank
4. Bot gera QR Code automaticamente
5. Bot envia QR Code e chave PIX ao usuário
6. Usuário paga via PIX
7. **Webhook automático** recebe confirmação da EfiBank
8. Bot adiciona saldo automaticamente à conta do usuário
9. Bot envia DM confirmando adição de saldo

### Fluxo de Webhook Automático

1. EfiBank envia webhook para `/webhook/pix` quando pagamento é confirmado
2. Bot valida IP da requisição (configurável)
3. Bot processa webhook e identifica transação
4. Bot atualiza status da transação para `paid`
5. Bot adiciona saldo ao usuário automaticamente
6. Bot envia DM ao usuário confirmando pagamento
7. Logs detalhados são registrados

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
├── commands/              # Comandos slash do Discord
│   ├── contas.ts         # Listar contas
│   ├── conta.ts          # Detalhes de conta
│   ├── admin.ts          # Comandos administrativos
│   ├── adicionarsaldo.ts # Adicionar saldo via PIX
│   └── meusaldo.ts       # Consultar saldo
├── handlers/              # Handlers de interações
│   ├── buttonHandler.ts  # Handlers de botões
│   ├── modalHandler.ts   # Handlers de modais
│   └── webhookHandler.ts # Handler de webhooks PIX
├── services/              # Serviços de negócio
│   ├── lztService.ts     # Cliente da API LZT
│   ├── purchaseService.ts # Lógica de compra
│   ├── balanceService.ts  # Gerenciamento de saldo
│   └── efiService.ts     # Integração EfiBank (PIX)
├── server/               # Servidor HTTP
│   └── webhookServer.ts  # Servidor Express para webhooks
├── storage/              # Sistema de storage
│   ├── orders.ts         # Gerenciamento de pedidos
│   ├── userBalances.ts   # Armazenamento de saldos
│   └── pixTransactions.ts # Transações PIX
├── types/                # Tipos TypeScript
│   └── lzt.ts            # Tipos da API LZT
├── utils/                # Utilitários
│   ├── embedBuilder.ts   # Builder de embeds
│   ├── rateLimiter.ts    # Rate limiting
│   ├── logger.ts         # Sistema de logs
│   └── errorHandler.ts   # Tratamento de erros
└── index.ts              # Entry point do bot
```

## 🔐 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- Mantenha seus tokens seguros
- Use permissões adequadas no Discord (apenas admins podem usar `/admin`)
- Os arquivos JSON (`orders.json`, `user_balances.json`, `pix_transactions.json`) contêm informações sensíveis - mantenha seguros
- Webhook valida IP da EfiBank por padrão (configurável via `WEBHOOK_VALIDATE_IP`)
- Certificados SSL obrigatórios para produção

## 📚 Documentação

- [LZT Market API Documentation](https://lzt-market.readme.io/reference/information)
- [Discord.js Documentation](https://discord.js.org/)
- [EfiBank API Documentation](https://dev.efipay.com.br/)
- [Roadmap do Projeto](./docs/planejamento/ROADMAP.md) - Veja o que foi feito e o que está planejado

## 📊 Status do Projeto

✅ **Em Produção** - Sistema funcionando com:
- Sistema de pagamento PIX completo
- Webhook automático funcionando
- Sistema de saldo implementado
- Comandos administrativos completos

Veja o [ROADMAP.md](./docs/planejamento/ROADMAP.md) para mais detalhes sobre o progresso e próximas funcionalidades.

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

