# 🚀 Configurar Webhook no Railway - Guia Atualizado

## ✅ Como o Railway Funciona

**Boa notícia:** O Railway **já expõe sua aplicação automaticamente**! Você não precisa configurar "Public Networking" manualmente.

---

## 📋 Passo 1: Encontrar o Domínio Público

### 1.1 Acesse o Serviço do Bot

1. Vá para: https://railway.app/
2. Entre no seu projeto
3. **Clique no serviço do bot** (não no projeto, mas no serviço específico)

### 1.2 Encontre o Domínio Público

O Railway gera automaticamente um domínio público. Procure por:

**Opção A: Na aba "Settings"**
1. Clique em **"Settings"** no serviço
2. Procure por **"Networking"** ou **"Public Domain"**
3. Você verá algo como:
   ```
   https://seu-bot-production.up.railway.app
   ```

**Opção B: Na aba "Deployments"**
1. Clique em **"Deployments"**
2. Procure por um link/URL pública
3. Geralmente aparece como: `https://seu-bot-production.up.railway.app`

**Opção C: Na aba "Variables"**
1. Às vezes aparece uma variável `RAILWAY_PUBLIC_DOMAIN` ou similar

### 1.3 Sua URL do Webhook Será:

```
https://seu-bot-production.up.railway.app/webhook/pix
```

**⚠️ IMPORTANTE:** Substitua `seu-bot-production.up.railway.app` pelo domínio real do seu serviço!

---

## 📋 Passo 2: Verificar Porta do Webhook

### 2.1 Verifique Variáveis de Ambiente

No Railway, vá em **"Variables"** e confirme:

```env
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000
```

**⚠️ IMPORTANTE:** O Railway usa a variável `PORT` para expor a aplicação. Se seu webhook está na porta 3000, você pode:

**Opção A:** Usar a porta padrão do Railway (`PORT`)
- Configure `WEBHOOK_PORT` igual a `PORT`
- Ou use `PORT` diretamente no código

**Opção B:** Manter porta 3000 separada
- O Railway ainda vai expor, mas você precisa garantir que está escutando na porta correta

### 2.2 Verificar Logs

Após fazer deploy, verifique os logs do Railway:

```
[WEBHOOK] Servidor webhook iniciado na porta 3000
[WEBHOOK] Endpoints disponíveis:
[WEBHOOK]   - GET  /health
[WEBHOOK]   - POST /webhook/pix
```

Se aparecer isso, está funcionando! ✅

---

## 📋 Passo 3: Testar a URL Pública

### 3.1 Teste o Health Check

Abra no navegador ou use curl:

```
https://seu-bot-production.up.railway.app/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "service": "webhook-server"
}
```

### 3.2 Teste o Webhook (Postman ou curl)

**No Postman:**
- Método: `POST`
- URL: `https://seu-bot-production.up.railway.app/webhook/pix`
- Body: `{"test": "data"}`

**Ou com curl:**
```bash
curl -X POST https://seu-bot-production.up.railway.app/webhook/pix \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Deve retornar:**
```json
{
  "received": true,
  "processed": false,
  "timestamp": "2025-11-18T...",
  "message": "Webhook recebido mas não processado (serviços não disponíveis)"
}
```

---

## 📋 Passo 4: Registrar na EfiBank

### 4.1 Acesse Painel da EfiBank

1. Vá para: https://app.sejaefi.com.br/
2. Faça login
3. Vá em **"API"** → **"Webhooks"** ou **"Configurações"** → **"Webhooks"**

### 4.2 Configure o Webhook

1. Procure por **"URL de Webhook"** ou **"URL de Notificação"**
2. Cole a URL completa:
   ```
   https://seu-bot-production.up.railway.app/webhook/pix
   ```
3. Selecione os eventos:
   - ✅ **PIX Recebido** (obrigatório)
   - ✅ **Cobrança Paga** (recomendado)
4. Salve

### 4.3 Teste o Webhook

A EfiBank pode enviar um webhook de teste. Verifique:
- Logs do Railway
- Se aparecer `"received": true` nos logs

---

## 🔍 Troubleshooting

### Não encontro o domínio público

**Solução:**
1. Certifique-se de que está olhando o **SERVIÇO** (não o projeto)
2. Verifique se o deploy foi concluído com sucesso
3. O domínio pode levar alguns minutos para aparecer após o primeiro deploy

### URL retorna 404 Not Found

**Possíveis causas:**
1. Bot não está rodando
2. Porta incorreta
3. Rota incorreta

**Solução:**
- Verifique logs do Railway
- Confirme que `WEBHOOK_ENABLED=true`
- Teste `/health` primeiro

### URL retorna Connection Refused

**Possíveis causas:**
1. Serviço não está rodando
2. Porta não está sendo exposta

**Solução:**
- Verifique se o bot está online no Railway
- Verifique logs para erros
- Confirme que `WEBHOOK_PORT` está configurado

---

## ✅ Checklist

Antes de considerar completo:

- [ ] Domínio público encontrado no Railway
- [ ] URL do webhook montada: `https://seu-bot.railway.app/webhook/pix`
- [ ] `/health` retorna `{"status": "ok"}`
- [ ] `/webhook/pix` recebe requisições (teste no Postman)
- [ ] URL registrada no painel da EfiBank
- [ ] Webhook de teste recebido (verificar logs)

---

## 💡 Dica Importante

**O Railway expõe automaticamente sua aplicação!** Você só precisa:
1. ✅ Encontrar o domínio público
2. ✅ Garantir que o webhook está escutando na porta correta
3. ✅ Registrar a URL na EfiBank

**Não precisa configurar "Public Networking" manualmente!**

---

## 🆘 Ainda com Dúvida?

Se não encontrar o domínio público:
1. Tire um print da tela do Railway (Settings do serviço)
2. Verifique se o deploy foi concluído
3. O domínio pode estar em diferentes lugares dependendo da versão do Railway

