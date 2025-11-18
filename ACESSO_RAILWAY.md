# 🚂 Como Acessar Arquivos no Railway

## 📁 Onde ficam os arquivos JSON

Os arquivos são criados automaticamente no servidor Railway:
- `pix_transactions.json` - Transações PIX
- `user_balances.json` - Saldos dos usuários
- `orders.json` - Pedidos
- `published_accounts.json` - Contas publicadas (futuro)
- `purchase_logs.json` - Logs de compras (futuro)

## 🔍 Métodos para Acessar

### Método 1: Via Terminal SSH (Recomendado)

1. **Acesse o Railway Dashboard:**
   - Vá para: https://railway.app/
   - Faça login na sua conta

2. **Abra o projeto:**
   - Clique no seu projeto `LZTMarketxyz`

3. **Abra o Terminal:**
   - No menu lateral, clique em **"Deployments"** ou **"Settings"**
   - Procure por **"Connect"** ou **"Shell"** ou **"Terminal"**
   - Ou clique no botão **"⚡"** (New Terminal) na parte superior

4. **Navegue até o diretório:**
   ```bash
   cd /app
   ls -la
   ```

5. **Visualize o arquivo:**
   ```bash
   # Ver conteúdo do arquivo
   cat pix_transactions.json
   
   # Ou com formatação
   cat pix_transactions.json | jq .
   
   # Ver últimas linhas
   tail -n 50 pix_transactions.json
   ```

### Método 2: Via Logs do Railway

1. **Acesse os Logs:**
   - No Railway Dashboard, vá em **"Deployments"**
   - Clique no deployment mais recente
   - Vá na aba **"Logs"**

2. **Os logs mostram:**
   - Quando arquivos são criados
   - Quando transações são salvas
   - Erros ao salvar arquivos

### Método 3: Via API/Endpoint (Futuro - Opcional)

Podemos criar um endpoint HTTP para visualizar os arquivos (requer autenticação).

## 📋 Comandos Úteis no Terminal Railway

```bash
# Ver todos os arquivos JSON
ls -la *.json

# Ver conteúdo de um arquivo específico
cat pix_transactions.json

# Ver tamanho do arquivo
du -h pix_transactions.json

# Contar quantas transações existem
cat pix_transactions.json | jq '. | length'

# Ver última transação
cat pix_transactions.json | jq '.[-1]'

# Procurar transação específica
cat pix_transactions.json | jq '.[] | select(.transaction_id == "pix_xxx")'

# Ver transações pendentes
cat pix_transactions.json | jq '.[] | select(.status == "pending")'

# Ver transações de um usuário específico
cat pix_transactions.json | jq '.[] | select(.user_id == "123456789")'
```

## ⚠️ Importante

- **Não edite os arquivos manualmente** - Use os comandos do bot
- **Backup:** Os arquivos são salvos automaticamente, mas considere fazer backup periódico
- **Segurança:** Os arquivos contêm dados sensíveis (IDs de transação, valores, etc.)

## 🔄 Alternativa: Usar Comando do Bot

**Mais fácil:** Use o comando `/admin transacoes-pix` diretamente no Discord!

## 📝 Nota sobre jq

Se o comando `jq` não estiver disponível no Railway, você pode:
- Instalar: `apt-get update && apt-get install -y jq` (se tiver permissão)
- Ou usar `cat` e visualizar o JSON diretamente (menos formatado)

