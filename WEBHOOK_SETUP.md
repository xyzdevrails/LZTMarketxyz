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

### Passo 2: Configurar URL Pública (Railway)
- Expor porta 3000 no Railway
- Obter URL pública (ex: `https://seu-bot.railway.app/webhook/pix`)
- Configurar no painel da EfiBank

### Passo 3: Validação de Assinatura
- Implementar validação mTLS
- Verificar assinatura do webhook
- Rejeitar requisições inválidas

### Passo 4: Processamento de Eventos
- Processar evento de pagamento confirmado
- Integrar com BalanceService
- Adicionar saldo automaticamente

### Passo 5: Notificação ao Usuário
- Enviar DM quando saldo for adicionado
- Mostrar valor e novo saldo

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

