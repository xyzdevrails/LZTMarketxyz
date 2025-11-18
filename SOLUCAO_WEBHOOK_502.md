# 🔧 Solução: Erro 502 - Application failed to respond

## ❌ Problema Identificado

Nos logs do Railway, vejo:
```
WEBHOOK_ENABLED: false
```

**Isso significa que o webhook NÃO está sendo iniciado!**

Por isso você recebe erro 502 - a aplicação não está escutando na porta 3000.

---

## ✅ Solução: Habilitar Webhook no Railway

### Passo 1: Adicionar Variável no Railway

1. **Acesse Railway Dashboard**
2. **Vá em "Variables"** (no serviço do bot)
3. **Clique em "+ New Variable"**
4. **Adicione:**
   - **Key:** `WEBHOOK_ENABLED`
   - **Value:** `true`
5. **Salve**

### Passo 2: Aguardar Redeploy

O Railway vai fazer deploy automaticamente após adicionar a variável.

### Passo 3: Verificar Logs

Após o deploy, procure nos logs por:

```
[WEBHOOK] Servidor webhook iniciado na porta 3000
[WEBHOOK] Endpoints disponíveis:
[WEBHOOK]   - GET  /health
[WEBHOOK]   - POST /webhook/pix
```

**Se aparecer isso, está funcionando!** ✅

---

## ✅ Passo 4: Testar Novamente

### 4.1 Teste o Health Check

No Postman ou navegador:
```
GET https://lztmarketxyz-production.up.railway.app/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "service": "webhook-server"
}
```

### 4.2 Se funcionar, está tudo certo! ✅

---

## 📋 Checklist de Variáveis no Railway

Certifique-se de que estas variáveis estão configuradas:

```env
# Webhook (OBRIGATÓRIO)
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000  # Opcional, pois já usa PORT do Railway

# Discord (OBRIGATÓRIO)
DISCORD_BOT_TOKEN=seu_token

# LZT Market (OBRIGATÓRIO)
LZT_API_TOKEN=seu_token
LZT_API_BASE_URL=https://prod-api.lzt.market

# EfiBank (para processar pagamentos)
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_CERTIFICATE_BASE64=seu_certificado
EFI_PIX_KEY=sua_chave_pix
EFI_SANDBOX=true  # ou false para produção
```

---

## 🔍 Por Que Aconteceu?

O código verifica:
```typescript
if (WEBHOOK_ENABLED) {
  // Inicia webhook
}
```

Se `WEBHOOK_ENABLED` não for `true`, o webhook **não é iniciado**, então:
- ❌ Nada escuta na porta 3000
- ❌ Railway retorna 502 (aplicação não responde)
- ❌ `/health` não funciona

---

## ✅ Após Configurar

1. **Adicione `WEBHOOK_ENABLED=true` no Railway**
2. **Aguarde o deploy** (alguns segundos)
3. **Verifique os logs** (deve aparecer webhook iniciado)
4. **Teste `/health`** (deve retornar `{"status": "ok"}`)

---

## 🆘 Se Ainda Não Funcionar

Verifique nos logs:
1. `[WEBHOOK] Servidor webhook iniciado` aparece?
2. Algum erro relacionado a porta?
3. Bot está online no Discord?

Se aparecer erro, compartilhe os logs que eu ajudo a resolver!

