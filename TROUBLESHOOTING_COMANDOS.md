# 🔧 Troubleshooting - Comandos Não Aparecem

## ❌ Problema: `/adicionarsaldo` não aparece

---

## ✅ Checklist de Diagnóstico

### 1. **Variáveis de Ambiente Configuradas?**

O comando `/adicionarsaldo` **só aparece** se estas variáveis estiverem configuradas:

```env
EFI_CLIENT_ID=seu_client_id_aqui
EFI_CLIENT_SECRET=seu_client_secret_aqui
```

**Verificação:**
- Abra seu `.env` (local) ou Railway Dashboard (produção)
- Verifique se essas duas variáveis existem e têm valores

**Se NÃO estiverem configuradas:**
- ❌ Comando não será registrado
- ❌ Não aparecerá no Discord

---

### 2. **Bot Está Rodando?**

Verifique se o bot está online:
- ✅ Ícone verde no Discord
- ✅ Logs mostram "Bot conectado"

**Se não estiver:**
- Inicie o bot: `npm run dev` (local) ou verifique Railway (produção)

---

### 3. **Comandos Foram Registrados?**

Verifique os logs do bot ao iniciar. Você deve ver:

```
[COMANDOS] Registrando X comandos:
[COMANDOS]   - /adicionarsaldo: Adiciona saldo à sua conta via PIX
[COMANDOS]   - /meusaldo: Verifica seu saldo atual na conta
...
[COMANDOS] Comandos slash registrados globalmente!
```

**Se NÃO aparecer `/adicionarsaldo` nos logs:**
- ❌ Variáveis `EFI_CLIENT_ID` ou `EFI_CLIENT_SECRET` não estão configuradas
- ❌ Bot não conseguiu ler as variáveis

---

### 4. **Discord Atualizou os Comandos?**

O Discord pode levar **5-15 minutos** (às vezes até 1 hora) para atualizar comandos após registro.

**Soluções:**
1. **Aguarde 5-15 minutos** e tente novamente
2. **Reinicie o Discord** (fecha e abre novamente)
3. **Force atualização:** Digite `/` e pressione `Esc`, depois digite `/` novamente

---

### 5. **Verificar Logs de Debug**

Adicione logs temporários para verificar:

Nos logs do bot, procure por:
```
[DEBUG] WEBHOOK_ENABLED: true
[DEBUG] WEBHOOK_PORT: 3000
```

Se aparecer logs de webhook mas não de comandos, as variáveis EfiBank não estão configuradas.

---

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar .env (Local)

Abra o arquivo `.env` na raiz do projeto e verifique:

```env
# Essas são OBRIGATÓRIAS para /adicionarsaldo aparecer:
EFI_CLIENT_ID=Client_Id_xxx
EFI_CLIENT_SECRET=Client_Secret_xxx

# Essas são opcionais (comando aparece mesmo sem elas):
EFI_PIX_KEY=sua_chave_pix
EFI_SANDBOX=true
EFI_CERTIFICATE_BASE64=xxx
```

**Se não tiver `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET`:**
- ❌ Comando não aparecerá
- ✅ Adicione essas variáveis

---

### Passo 2: Verificar Railway (Produção)

1. Acesse Railway Dashboard
2. Vá em **Variables**
3. Procure por:
   - `EFI_CLIENT_ID`
   - `EFI_CLIENT_SECRET`

**Se não existirem:**
- Adicione manualmente no Railway
- Faça novo deploy

---

### Passo 3: Verificar Logs do Bot

Ao iniciar o bot, procure por:

**✅ Se aparecer:**
```
[COMANDOS]   - /adicionarsaldo: Adiciona saldo à sua conta via PIX
```
→ Comando foi registrado, aguarde Discord atualizar

**❌ Se NÃO aparecer:**
```
[COMANDOS]   - /contas: ...
[COMANDOS]   - /conta: ...
[COMANDOS]   - /admin: ...
[COMANDOS]   - /meusaldo: ...
```
→ `/adicionarsaldo` não foi registrado (variáveis não configuradas)

---

## 🚀 Solução Rápida

### Para Ambiente Local:

1. **Abra `.env`** na raiz do projeto

2. **Adicione (se não tiver):**
   ```env
   EFI_CLIENT_ID=seu_client_id_aqui
   EFI_CLIENT_SECRET=seu_client_secret_aqui
   ```

3. **Pare o bot** (Ctrl+C)

4. **Inicie novamente:**
   ```bash
   npm run dev
   ```

5. **Verifique os logs:**
   - Deve aparecer `/adicionarsaldo` na lista de comandos

6. **Aguarde 5-15 minutos** e teste no Discord

---

### Para Railway (Produção):

1. **Railway Dashboard** → Seu Projeto → **Variables**

2. **Adicione:**
   - `EFI_CLIENT_ID` = seu client id
   - `EFI_CLIENT_SECRET` = seu client secret

3. **Aguarde deploy** (automático após salvar)

4. **Verifique logs** no Railway

5. **Aguarde 5-15 minutos** e teste no Discord

---

## 💡 Dicas Importantes

1. **Variáveis são obrigatórias:**
   - `EFI_CLIENT_ID` ✅
   - `EFI_CLIENT_SECRET` ✅
   - Outras são opcionais (certificado, etc.)

2. **Comando aparece mesmo sem certificado:**
   - Se tiver `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET`, o comando aparece
   - Mas mostrará erro ao usar se certificado não estiver configurado

3. **Discord pode demorar:**
   - Até 1 hora em casos raros
   - Reiniciar Discord ajuda

4. **Sempre verifique logs:**
   - Logs mostram exatamente o que foi registrado

---

## 🆘 Se Nada Funcionar

1. **Compartilhe os logs** do bot (especialmente a parte de `[COMANDOS]`)
2. **Verifique se variáveis estão corretas** (sem espaços, sem aspas)
3. **Tente reiniciar o bot** completamente
4. **Aguarde mais tempo** (Discord pode demorar)

---

## 📝 Nota Técnica

O código verifica assim:
```typescript
if (process.env.EFI_CLIENT_ID && process.env.EFI_CLIENT_SECRET) {
  commands.set(adicionarsaldoCommand.data.name, adicionarsaldoCommand);
}
```

**Se qualquer uma dessas variáveis estiver faltando ou vazia, o comando não será registrado.**

