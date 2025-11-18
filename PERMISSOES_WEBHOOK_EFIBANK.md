# 🔐 Permissões Necessárias para Webhook EfiBank

## ✅ Permissões Obrigatórias

Para registrar webhook automaticamente, você precisa habilitar estas permissões no painel da EfiBank:

### 1. **Alterar Webhooks** ✅ **OBRIGATÓRIA**
- **O que faz:** Permite alteração do webhooks
- **Onde encontrar:** No painel da EfiBank → Aplicações → Suas Credenciais → Permissões
- **Por que precisa:** Para registrar a URL do webhook na EfiBank via API

### 2. **Consultar Webhooks** ✅ **RECOMENDADA**
- **O que faz:** Permite consulta de webhooks
- **Onde encontrar:** No painel da EfiBank → Aplicações → Suas Credenciais → Permissões
- **Por que precisa:** Para verificar se o webhook já está registrado antes de registrar novamente

---

## 📋 Outras Permissões Necessárias (Já Devem Estar Habilitadas)

Para o sistema completo funcionar, você também precisa de:

### Para Criar Cobranças PIX:
- ✅ **Alterar cobranças** - Para criar cobranças PIX imediatas
- ✅ **Consultar cobranças** - Para consultar status das cobranças

### Para Gerar QR Code:
- ✅ **Consultar Payloads** - Para gerar QR Code PIX (já deve estar habilitada)

---

## 🎯 Como Habilitar as Permissões

### Passo a Passo:

1. **Acesse o Painel da EfiBank**
   - Faça login em: https://app.efipay.com.br

2. **Vá em "Aplicações" ou "API"**
   - Procure pela seção de credenciais/permissões

3. **Encontre suas Credenciais**
   - Procure pelo `CLIENT_ID` que você está usando

4. **Edite as Permissões**
   - Clique em "Editar" ou "Configurar Permissões"

5. **Habilite as Permissões:**
   - ✅ **Alterar Webhooks** ← **ESSENCIAL!**
   - ✅ **Consultar Webhooks** ← Recomendado
   - ✅ **Alterar cobranças** ← Já deve estar
   - ✅ **Consultar cobranças** ← Já deve estar
   - ✅ **Consultar Payloads** ← Já deve estar

6. **Salve as Alterações**
   - Clique em "Salvar" ou "Atualizar"

---

## ⚠️ Importante

### Se Você Não Habilitar "Alterar Webhooks":

O bot **não conseguirá registrar o webhook automaticamente** e você verá este erro:

```
Erro ao registrar webhook: Acesso negado. Verifique se tem a permissão "webhook.write" habilitada.
```

**Solução:** Habilite a permissão **"Alterar Webhooks"** no painel da EfiBank.

---

## 🔍 Verificando se Está Funcionando

Após habilitar as permissões e fazer deploy:

1. **Verifique os logs do Railway**
2. **Procure por:**
   ```
   [WEBHOOK] ✅ Webhook registrado automaticamente na EfiBank!
   ```
3. **Se aparecer esse log:** ✅ Tudo funcionando!
4. **Se aparecer erro:** Verifique se habilitou "Alterar Webhooks"

---

## 📝 Resumo das Permissões

| Permissão | Status | Necessária Para |
|-----------|--------|-----------------|
| **Alterar Webhooks** | ⚠️ **HABILITAR** | Registrar webhook automaticamente |
| **Consultar Webhooks** | ✅ Recomendado | Verificar webhook existente |
| Alterar cobranças | ✅ Já deve estar | Criar cobranças PIX |
| Consultar cobranças | ✅ Já deve estar | Consultar status |
| Consultar Payloads | ✅ Já deve estar | Gerar QR Code |

---

## 💡 Dica

**Se você não conseguir habilitar as permissões:**

1. Entre em contato com o suporte da EfiBank
2. Peça para habilitarem a permissão "Alterar Webhooks"
3. Explique que precisa registrar webhook via API

Ou você pode registrar o webhook manualmente via API usando Postman ou curl (mas o registro automático é mais fácil!).

---

## ✅ Checklist

- [ ] Acessei o painel da EfiBank
- [ ] Encontrei minhas credenciais
- [ ] Habilitei **"Alterar Webhooks"**
- [ ] Habilitei **"Consultar Webhooks"** (recomendado)
- [ ] Salvei as alterações
- [ ] Fiz deploy do bot
- [ ] Verifiquei os logs do Railway
- [ ] Vi a mensagem "Webhook registrado automaticamente" ✅

---

## 🎉 Pronto!

Após habilitar as permissões, o webhook será registrado automaticamente quando o bot iniciar!

