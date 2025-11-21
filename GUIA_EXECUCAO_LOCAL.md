# 🚀 Guia de Execução Local

## Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Discord Bot (OBRIGATÓRIO)
DISCORD_BOT_TOKEN=seu_token_discord_aqui

# LZT Market API (OBRIGATÓRIO)
LZT_API_TOKEN=seu_token_lzt_aqui
LZT_API_BASE_URL=https://prod-api.lzt.market

# EfiBank (PIX) - OPCIONAL para testes básicos
EFI_CLIENT_ID=seu_client_id_efibank
EFI_CLIENT_SECRET=seu_client_secret_efibank
EFI_PIX_KEY=sua_chave_pix@email.com
EFI_SANDBOX=false
EFI_CERT_BASE64=certificado_base64_aqui

# Webhook - OPCIONAL para testes básicos
WEBHOOK_ENABLED=false
WEBHOOK_PORT=3000
WEBHOOK_URL=https://seu-dominio.com
WEBHOOK_VALIDATE_IP=true

# Porta (para Railway/Heroku)
PORT=3000
```

### ⚠️ Mínimo Necessário para Testar

Para testar os comandos básicos (`/contas`, `/conta`), você precisa apenas:

```env
DISCORD_BOT_TOKEN=seu_token_discord_aqui
LZT_API_TOKEN=seu_token_lzt_aqui
LZT_API_BASE_URL=https://prod-api.lzt.market
```

Os serviços de PIX e Webhook são opcionais e só são necessários para testar funcionalidades de pagamento.

## Passo 2: Executar o Bot

### Modo Desenvolvimento (Recomendado para testes)

```bash
npm run dev
```

Este comando:
- ✅ Usa `ts-node-dev` para hot-reload automático
- ✅ Reinicia automaticamente quando você salva arquivos
- ✅ Mostra logs detalhados no console

### Modo Produção

```bash
npm run build
npm start
```

## Passo 3: Verificar se Está Funcionando

Quando o bot iniciar, você verá no console:

```
[INFO] Bot conectado como SeuBot#1234!
[INFO] Bot ID: 123456789012345678
[INFO] Cache de skins carregado com sucesso
```

### Testar Comandos no Discord

1. Abra seu servidor Discord
2. Digite `/contas` para listar contas
3. Digite `/conta id:123456` para ver detalhes de uma conta específica

## 🔍 Troubleshooting

### Erro: "DISCORD_BOT_TOKEN não encontrado no .env"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme que o token está correto (sem espaços extras)

### Erro: "LZT_API_TOKEN não encontrado no .env"
- Verifique se o token LZT está configurado
- Confirme que o token tem acesso à API Market (scope `market`)

### Bot não responde aos comandos
- Verifique se o bot está online no Discord
- Confirme que o bot tem permissões no servidor
- Verifique os logs no console para erros

### Erro ao carregar imagens de skins
- O cache de skins será criado automaticamente na primeira execução
- Verifique se há conexão com a internet (precisa acessar valorant-api.com)
- O cache será salvo em `cache/valorant-skins.json`

## 📝 Logs Úteis

Durante a execução, você verá logs como:

```
[SkinsCache] Buscando skins da API Valorant...
[SkinsCache] ✅ 1500 skins carregadas e salvas no cache
[SkinsGrid] Gerando grid para 10 skins...
[SkinsGrid] ✅ Grid gerado com sucesso
```

## 🎯 Próximos Passos

Após testar localmente:
1. Teste o comando `/contas` para verificar se está buscando contas
2. Teste o comando `/conta id:XXXXXX` para verificar se está gerando o grid de skins
3. Verifique se as imagens estão sendo carregadas corretamente

