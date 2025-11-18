# 🧪 Testar Webhook Automático da EfiBank

## 💡 Boa Notícia

**A EfiBank pode enviar webhooks automaticamente** quando você cria uma cobrança PIX, **sem precisar configurar manualmente**!

---

## 🧪 Teste Rápido

### Passo 1: Criar Transação de Teste

1. **No Discord, use o comando:**
   ```
   /adicionarsaldo valor:1
   ```

2. **Confirme a transação** (clique em "Confirmar")

3. **Você receberá um QR Code PIX**

### Passo 2: Verificar Logs do Railway

Após criar a cobrança, verifique os logs do Railway:

**Procure por:**
```
[WEBHOOK] Webhook recebido: POST /webhook/pix
[WEBHOOK_HANDLER] Processando webhook PIX...
```

**Se aparecer isso, o webhook está funcionando automaticamente!** ✅

---

## 🔍 O Que Acontece

### Fluxo Completo:

1. **Você cria cobrança** via `/adicionarsaldo`
2. **Bot cria cobrança na EfiBank** via API
3. **EfiBank envia webhook automaticamente** para sua URL (se configurada)
4. **Bot recebe webhook** e processa
5. **Saldo é adicionado** automaticamente
6. **DM é enviada** ao usuário

---

## ⚠️ Se Não Receber Webhook

### Possíveis Causas:

1. **Webhook não está configurado na conta EfiBank**
   - Pode precisar configurar via API ou painel
   - Ou pode não estar disponível no seu plano

2. **URL não está acessível**
   - Verifique se `https://lztmarketxyz-production.up.railway.app/webhook/pix` está funcionando
   - Teste no Postman primeiro

3. **EfiBank não consegue acessar sua URL**
   - Verifique firewall/segurança
   - Certifique-se de que está usando HTTPS

---

## ✅ Solução Temporária: Processamento Manual

**Se o webhook não funcionar automaticamente, você pode processar manualmente:**

### Quando Alguém Pagar:

1. **Pegue o `txid`** da transação PIX
2. **Use o comando:**
   ```
   /admin liberar-saldo transaction_id:pix_xxx
   ```
3. **O saldo será adicionado** manualmente

---

## 📋 Próximos Passos

1. **Teste criar uma cobrança** (`/adicionarsaldo valor:1`)
2. **Verifique os logs** do Railway
3. **Se aparecer webhook recebido:** Está funcionando! ✅
4. **Se não aparecer:** Use processamento manual temporariamente

---

## 🆘 Precisa de Ajuda?

Se não receber webhook automaticamente:

1. **Verifique documentação da EfiBank:**
   - https://dev.efipay.com.br/docs/api-pix/webhooks

2. **Contate suporte EfiBank:**
   - Pergunte: "Como configurar webhook para receber notificações PIX automaticamente?"

3. **Use processamento manual** enquanto isso

---

## 🎯 Resumo

- ✅ Webhook servidor está funcionando
- ✅ URL pública está configurada
- ⏳ Teste se EfiBank envia automaticamente
- ✅ Processamento manual disponível como alternativa

