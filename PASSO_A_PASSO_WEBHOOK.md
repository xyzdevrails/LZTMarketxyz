# 🎯 Passo a Passo - Configurar Webhook no Railway

## ✅ Passo 1: Gerar Domínio Público

### 1.1 Na tela de "Networking" que você está vendo:

1. **Clique no botão "Generate Domain"** (botão roxo com ícone de raio ⚡)
2. O Railway vai gerar automaticamente um domínio público
3. Você verá algo como:
   ```
   https://seu-bot-production.up.railway.app
   ```

### 1.2 Anote essa URL!

Você vai precisar dela para configurar na EfiBank.

---

## ✅ Passo 2: Montar URL do Webhook

Sua URL do webhook será:

```
https://seu-bot-production.up.railway.app/webhook/pix
```

**⚠️ IMPORTANTE:** Substitua `seu-bot-production.up.railway.app` pelo domínio que o Railway gerou!

---

## ✅ Passo 3: Testar a URL

### 3.1 Teste o Health Check

Abra no navegador:
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

### 3.2 Se funcionar, está tudo certo! ✅

---

## ✅ Passo 4: Registrar na EfiBank

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

---

## ✅ Passo 5: Verificar Funcionamento

### 5.1 Verifique Logs do Railway

Após configurar na EfiBank, verifique os logs:
- Vá em **"Deployments"** ou **"Logs"** no Railway
- Procure por linhas com `[WEBHOOK]`

### 5.2 A EfiBank pode enviar um webhook de teste

Se aparecer nos logs:
```
[WEBHOOK] Webhook recebido...
[WEBHOOK] Payload: {...}
```

**Está funcionando!** ✅

---

## 🔍 Troubleshooting

### Health check não funciona

**Possíveis causas:**
1. Bot não está rodando
2. Porta incorreta
3. Webhook não está habilitado

**Solução:**
- Verifique se `WEBHOOK_ENABLED=true` nas variáveis do Railway
- Verifique logs do Railway para erros
- Confirme que o bot está online

### Webhook não recebe requisições da EfiBank

**Possíveis causas:**
1. URL incorreta no painel da EfiBank
2. Webhook não está registrado corretamente

**Solução:**
- Verifique se a URL termina com `/webhook/pix`
- Confirme que salvou as configurações na EfiBank
- Teste manualmente no Postman primeiro

---

## ✅ Checklist Final

- [ ] Domínio público gerado no Railway
- [ ] URL do webhook montada: `https://seu-bot.railway.app/webhook/pix`
- [ ] `/health` retorna `{"status": "ok"}`
- [ ] URL registrada no painel da EfiBank
- [ ] Webhook de teste recebido (verificar logs)

---

## 🎯 Próximo Passo

Depois de gerar o domínio, me envie a URL que apareceu para eu te ajudar a testar! 🚀

