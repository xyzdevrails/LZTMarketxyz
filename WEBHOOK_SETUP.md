# 🔗 Configuração do Webhook EfiBank

## ✅ Passo 1: Estrutura Básica (CONCLUÍDO)

Servidor HTTP básico criado e integrado ao bot Discord.

### O que foi implementado:

1. ✅ Servidor Express criado (`src/server/webhookServer.ts`)
2. ✅ Integração com o bot Discord (`src/index.ts`)
3. ✅ Endpoints básicos:
   - `GET /health` - Health check
   - `POST /webhook/pix` - Endpoint para receber webhooks PIX
   - `POST /webhook/test` - Endpoint de teste

---

## ✅ Passo 2: Processamento Automático (CONCLUÍDO)

Handler para processar eventos de pagamento automaticamente.

### O que foi implementado:

1. ✅ `WebhookHandler` criado (`src/handlers/webhookHandler.ts`)
2. ✅ Extração de txid do payload (suporta múltiplos formatos)
3. ✅ Identificação de eventos de pagamento confirmado
4. ✅ Integração com `BalanceService` para confirmar pagamentos
5. ✅ Envio automático de DM ao usuário quando saldo for adicionado
6. ✅ Logs detalhados de todo o processo

### Como funciona agora:

1. EfiBank envia webhook para `/webhook/pix`
2. Bot extrai `txid` do payload
3. Bot identifica se é pagamento confirmado
4. Bot confirma pagamento via `BalanceService`
5. Bot adiciona saldo ao usuário automaticamente
6. Bot envia DM ao usuário confirmando
7. Responde 200 OK para EfiBank

### ⚠️ Importante:

- **Webhook agora processa pagamentos automaticamente!**
- Se webhook não funcionar, ainda pode usar `/admin liberar-saldo` manualmente
- Webhook responde 200 mesmo em caso de erro (para evitar reenvios)

### Variáveis de Ambiente Necessárias:

```env
# Habilitar webhook (true/false)
WEBHOOK_ENABLED=true

# Porta do servidor webhook (padrão: 3000)
WEBHOOK_PORT=3000
```

### Como Testar Localmente:

1. Configure as variáveis no `.env`:
   ```env
   WEBHOOK_ENABLED=true
   WEBHOOK_PORT=3000
   ```

2. Inicie o bot:
   ```bash
   npm run dev
   ```

3. Você deve ver nos logs:
   ```
   [WEBHOOK] Servidor webhook iniciado na porta 3000
   [WEBHOOK] Endpoints disponíveis:
   [WEBHOOK]   - GET  /health
   [WEBHOOK]   - POST /webhook/pix
   [WEBHOOK]   - POST /webhook/test
   ```

4. Teste o endpoint de health:
   ```bash
   curl http://localhost:3000/health
   ```

5. Teste o webhook:
   ```bash
   curl -X POST http://localhost:3000/webhook/test -H "Content-Type: application/json" -d '{"test": "data"}'
   ```

---

## 📋 Próximos Passos:

### Passo 3: Configurar URL Pública (Railway)
- Expor porta 3000 no Railway
- Obter URL pública (ex: `https://seu-bot.railway.app/webhook/pix`)
- Configurar no painel da EfiBank

### Passo 4: Validação de Assinatura (Opcional mas Recomendado)
- Implementar validação mTLS
- Verificar assinatura do webhook
- Rejeitar requisições inválidas
- **Nota:** Por enquanto funciona sem validação, mas é recomendado para produção

### Passo 5: Testes em Homologação
- Testar webhook com pagamentos reais em sandbox
- Verificar se saldo é adicionado corretamente
- Verificar se DM é enviada ao usuário

---

## ⚠️ Importante:

- **Por enquanto, o webhook apenas LOGA as requisições**
- **Não processa pagamentos ainda** (isso vem nos próximos passos)
- **O servidor roda na mesma instância do bot Discord**
- **Em produção, você precisará expor a porta no Railway**

---

## 🔍 Verificação:

Após iniciar o bot, verifique os logs:

```
[WEBHOOK] Servidor webhook iniciado na porta 3000
[WEBHOOK] Endpoints disponíveis:
[WEBHOOK]   - GET  /health
[WEBHOOK]   - POST /webhook/pix
[WEBHOOK]   - POST /webhook/test
```

Se aparecer isso, o **Passo 1 está completo**! ✅

