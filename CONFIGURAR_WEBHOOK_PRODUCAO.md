# 🚀 Configurar Webhook em Produção (Railway + EfiBank)

## ✅ Status Atual

- ✅ Webhook funcionando localmente
- ✅ Recebe requisições do Postman
- ✅ Logs funcionando
- ⏳ Próximo: Configurar URL pública

---

## 📋 Passo 1: Expor Porta no Railway

### 1.1 Acesse Railway Dashboard

1. Vá para: https://railway.app/
2. Entre no seu projeto
3. Clique no serviço do bot

### 1.2 Configure a Porta Pública

1. Vá em **Settings** (ou **Variables**)
2. Procure por **"Public Networking"** ou **"Ports"**
3. Adicione uma nova porta pública:
   - **Porta interna:** `3000` (ou a que você configurou em `WEBHOOK_PORT`)
   - **Tipo:** `HTTP`
   - **Domínio:** Railway vai gerar automaticamente (ex: `seu-bot.railway.app`)

### 1.3 Obtenha a URL Pública

Após configurar, Railway vai gerar uma URL como:
```
https://seu-bot-production.up.railway.app
```

**Sua URL do webhook será:**
```
https://seu-bot-production.up.railway.app/webhook/pix
```

**⚠️ IMPORTANTE:** Anote essa URL! Você vai precisar dela no próximo passo.

---

## 📋 Passo 2: Registrar Webhook na EfiBank

### 2.1 Acesse Painel da EfiBank

1. Vá para: https://app.sejaefi.com.br/
2. Faça login
3. Vá em **"API"** ou **"Webhooks"**

### 2.2 Configure o Webhook

1. Procure por **"Configurar Webhook"** ou **"URL de Notificação"**
2. Cole a URL do Railway:
   ```
   https://seu-bot-production.up.railway.app/webhook/pix
   ```
3. Selecione os eventos que quer receber:
   - ✅ **PIX Recebido** (obrigatório)
   - ✅ **Cobrança Paga** (recomendado)
   - Outros eventos (opcional)

4. Salve as configurações

### 2.3 Verificar Configuração

A EfiBank pode enviar um webhook de teste. Verifique:
- Logs do Railway
- Se aparecer `"received": true` nos logs

---

## 📋 Passo 3: Testar em Produção

### 3.1 Verificar Logs do Railway

1. Acesse Railway Dashboard
2. Vá em **"Deployments"** ou **"Logs"**
3. Procure por linhas com `[WEBHOOK]`

### 3.2 Criar Transação de Teste

1. Use `/adicionarsaldo` no Discord (no servidor onde o bot está)
2. Gere um QR Code
3. **Se estiver em SANDBOX:** Use o simulador de pagamento da EfiBank
4. **Se estiver em PRODUÇÃO:** Faça um pagamento real pequeno

### 3.3 Verificar Processamento

Após pagamento, verifique:
- ✅ Logs do Railway mostram webhook recebido
- ✅ Saldo do usuário foi adicionado
- ✅ DM foi enviada ao usuário

---

## 🔍 Troubleshooting

### Webhook não recebe requisições da EfiBank

**Possíveis causas:**
1. URL incorreta no painel da EfiBank
2. Porta não exposta no Railway
3. Firewall bloqueando

**Solução:**
- Verifique a URL no painel da EfiBank
- Confirme que a porta está pública no Railway
- Teste a URL manualmente: `curl https://seu-bot.railway.app/health`

### Webhook recebe mas não processa

**Possíveis causas:**
1. Certificado não configurado no Railway
2. `balanceService` não inicializado

**Solução:**
- Verifique se `EFI_CERTIFICATE_BASE64` está configurado no Railway
- Verifique logs para ver se `balanceService` foi inicializado

### Erro 404 Not Found

**Possíveis causas:**
1. URL incorreta (faltando `/webhook/pix`)
2. Bot não está rodando

**Solução:**
- Verifique se a URL termina com `/webhook/pix`
- Verifique se o bot está online no Railway

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] Porta 3000 exposta no Railway
- [ ] URL pública obtida (ex: `https://seu-bot.railway.app/webhook/pix`)
- [ ] URL registrada no painel da EfiBank
- [ ] Webhook de teste recebido (verificar logs)
- [ ] Transação de teste criada e paga
- [ ] Saldo adicionado automaticamente
- [ ] DM enviada ao usuário

---

## 📝 Variáveis de Ambiente no Railway

Certifique-se de que estas variáveis estão configuradas:

```env
# Webhook
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000

# EfiBank (obrigatórias para processar pagamentos)
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_CERTIFICATE_BASE64=seu_certificado_base64
EFI_PIX_KEY=sua_chave_pix
EFI_SANDBOX=true  # ou false para produção
```

---

## 🎯 Próximos Passos Após Configurar

1. **Testar com pagamento real** (pequeno valor)
2. **Monitorar logs** por alguns dias
3. **Implementar validação mTLS** (opcional, mas recomendado)
4. **Configurar alertas** para webhooks falhando

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:
1. Verifique os logs do Railway
2. Teste a URL manualmente: `curl https://seu-bot.railway.app/health`
3. Verifique se todas as variáveis estão configuradas
4. Consulte `TROUBLESHOOTING_WEBHOOK.md` para mais detalhes

