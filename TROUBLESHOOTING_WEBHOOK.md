# 🔧 Troubleshooting - Webhook não Conecta

## ❌ Erro: `ECONNREFUSED 127.0.0.1:3000`

Este erro significa que **não há nada escutando na porta 3000**.

---

## ✅ Checklist de Diagnóstico:

### 1. **O bot está rodando?**

Verifique se você iniciou o bot:
```bash
npm run dev
```

**Você deve ver nos logs:**
```
[WEBHOOK] Servidor webhook iniciado na porta 3000
```

**Se NÃO aparecer essa mensagem:**
- O webhook não iniciou
- Veja os logs para erros

---

### 2. **WEBHOOK_ENABLED está configurado?**

Verifique seu `.env`:
```env
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000
```

**Importante:**
- Deve ser exatamente `true` (minúsculas, sem aspas)
- Não pode ter espaços: `WEBHOOK_ENABLED = true` ❌
- Deve ser: `WEBHOOK_ENABLED=true` ✅

---

### 3. **A porta 3000 está ocupada?**

Teste se a porta está livre:
```bash
# Windows PowerShell
netstat -ano | findstr :3000

# Se aparecer algo, a porta está ocupada
```

**Solução:**
- Use outra porta (ex: `WEBHOOK_PORT=3001`)
- Ou feche o processo que está usando a porta 3000

---

### 4. **O .env está sendo carregado?**

Adicione um log temporário para verificar:

No `src/index.ts`, adicione após `dotenv.config()`:
```typescript
console.log('WEBHOOK_ENABLED:', process.env.WEBHOOK_ENABLED);
console.log('WEBHOOK_PORT:', process.env.WEBHOOK_PORT);
```

**Você deve ver:**
```
WEBHOOK_ENABLED: true
WEBHOOK_PORT: 3000
```

**Se aparecer `undefined`:**
- O `.env` não está sendo carregado
- Verifique se o arquivo está na raiz do projeto
- Verifique se não há erros de sintaxe no `.env`

---

### 5. **Há erros nos logs?**

Procure por mensagens de erro:
```
[WEBHOOK] Erro ao iniciar servidor webhook: ...
```

**Erros comuns:**
- `EADDRINUSE` - Porta já está em uso
- `EACCES` - Sem permissão para usar a porta
- `ENOENT` - Arquivo não encontrado

---

## 🔍 Passo a Passo para Resolver:

### Passo 1: Verificar se o bot está rodando
```bash
# Pare o bot (Ctrl+C) e inicie novamente
npm run dev
```

### Passo 2: Verificar os logs
Procure por:
```
[WEBHOOK] Servidor webhook iniciado na porta 3000
```

**Se aparecer:**
- ✅ Webhook está rodando
- Teste no Postman novamente

**Se NÃO aparecer:**
- ❌ Webhook não iniciou
- Veja mensagens de erro abaixo

### Passo 3: Verificar variáveis de ambiente
Adicione logs temporários (veja item 4 acima)

### Passo 4: Testar porta manualmente
```bash
# Tente iniciar um servidor simples na porta 3000
# Se der erro, a porta está ocupada
```

---

## 🚀 Solução Rápida:

1. **Pare o bot** (Ctrl+C)

2. **Verifique o `.env`:**
   ```env
   WEBHOOK_ENABLED=true
   WEBHOOK_PORT=3000
   ```

3. **Inicie o bot novamente:**
   ```bash
   npm run dev
   ```

4. **Procure nos logs:**
   ```
   [WEBHOOK] Servidor webhook iniciado na porta 3000
   ```

5. **Se aparecer, teste no Postman:**
   ```
   GET http://localhost:3000/health
   ```

---

## 💡 Dicas:

- **Sempre verifique os logs** quando iniciar o bot
- **Se mudar o `.env`, reinicie o bot**
- **Use `npm run dev` para desenvolvimento** (recompila automaticamente)

---

## 🆘 Se Nada Funcionar:

1. Compartilhe os logs completos do bot
2. Compartilhe o conteúdo do `.env` (sem tokens sensíveis)
3. Verifique se há erros de compilação (`npm run build`)

