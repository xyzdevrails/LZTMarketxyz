# 🔑 Atualizar Chave PIX no Railway

## ✅ Chave PIX Cadastrada:

```
vitorrosadecastro2000@gmail.com
```

---

## 📋 Passo a Passo para Atualizar no Railway:

### 1. **Acesse o Railway**
   - Vá em: https://railway.app
   - Faça login na sua conta

### 2. **Encontre seu Projeto**
   - Clique no projeto `LZTMarketxyz` (ou nome do seu projeto)

### 3. **Vá em "Variables"**
   - No menu lateral, clique em **"Variables"** ou **"Variables & Secrets"**

### 4. **Encontre `EFI_PIX_KEY`**
   - Procure pela variável `EFI_PIX_KEY` na lista
   - Clique para editar

### 5. **Atualize o Valor**
   - **Valor antigo:** (sua chave aleatória UUID)
   - **Valor novo:** `vitorrosadecastro2000@gmail.com`
   
   ⚠️ **IMPORTANTE:** Cole exatamente assim, sem espaços antes ou depois!

### 6. **Salve**
   - Clique em **"Save"** ou **"Update"**
   - O Railway vai fazer redeploy automaticamente

### 7. **Aguarde o Redeploy**
   - Aguarde alguns segundos (30-60 segundos)
   - O bot vai reiniciar automaticamente

---

## ✅ Verificar se Funcionou:

### 1. **Verifique os Logs do Railway**
   - Vá em **"Deployments"** ou **"Logs"**
   - Procure por:
     ```
     [EFI]   - Chave PIX: vitorrosad...@gmail.com
     ```

### 2. **Procure por Registro de Webhook**
   - Nos logs, procure por:
     ```
     [WEBHOOK] ✅ Webhook registrado automaticamente na EfiBank!
     ```
   - Se aparecer esse log, está funcionando! ✅

### 3. **Se Aparecer Erro**
   - Verifique se o e-mail está correto
   - Verifique se está no ambiente correto (SANDBOX vs PRODUÇÃO)
   - Verifique se a chave está cadastrada na conta EfiBank

---

## 🔍 Verificações Importantes:

### ✅ Ambiente Correto:
- Se `EFI_SANDBOX=true` → Chave deve estar cadastrada na conta **SANDBOX**
- Se `EFI_SANDBOX=false` → Chave deve estar cadastrada na conta **PRODUÇÃO**

### ✅ Formato Correto:
- ✅ Correto: `vitorrosadecastro2000@gmail.com`
- ❌ Errado: ` vitorrosadecastro2000@gmail.com ` (com espaços)
- ❌ Errado: `VITORROSADECASTRO2000@GMAIL.COM` (maiúsculas podem causar problemas)

---

## 🎯 Próximos Passos:

1. ✅ Atualize `EFI_PIX_KEY` no Railway
2. ⏳ Aguarde o redeploy
3. ⏳ Verifique os logs
4. ✅ Deve funcionar agora!

---

## 💡 Dica:

**Se quiser testar rapidamente:**
- Após atualizar, use `/adicionarsaldo valor:1` no Discord
- Veja se o QR Code é gerado corretamente
- Se funcionar, o webhook também deve funcionar!

---

## 📝 Resumo:

- **Chave PIX:** `vitorrosadecastro2000@gmail.com`
- **Ação:** Atualizar variável `EFI_PIX_KEY` no Railway
- **Resultado esperado:** Webhook registrado automaticamente ✅

**Boa sorte!** 🚀

