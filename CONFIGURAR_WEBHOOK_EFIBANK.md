# 🔗 Como Configurar Webhook na EfiBank

## ⚠️ Importante

A configuração de webhook na EfiBank pode ser feita de **duas formas**:

1. **Via Painel Web** (se disponível)
2. **Via API** (método mais confiável)

---

## 📋 Método 1: Via Painel Web (Se Disponível)

### Onde Procurar:

1. **Painel EfiBank:** https://app.sejaefi.com.br/
2. **Locais possíveis:**
   - **"API"** → **"Webhooks"**
   - **"Configurações"** → **"Webhooks"**
   - **"Integrações"** → **"Webhooks"**
   - **"PIX"** → **"Webhooks"**
   - **"Notificações"** → **"Webhooks"**

### Se Encontrar:

1. Clique em **"Adicionar Webhook"** ou **"Configurar Webhook"**
2. Cole a URL:
   ```
   https://lztmarketxyz-production.up.railway.app/webhook/pix
   ```
3. Selecione eventos:
   - ✅ **PIX Recebido**
   - ✅ **Cobrança Paga**
4. Salve

---

## 📋 Método 2: Via API (Recomendado)

A EfiBank permite configurar webhooks via API. Vamos criar um script para isso.

### 2.1 Verificar Documentação da EfiBank

A documentação oficial está em:
- https://dev.efipay.com.br/docs/api-pix/webhooks

### 2.2 Endpoint para Configurar Webhook

Geralmente é algo como:
```
POST https://api.efipay.com.br/v1/webhooks
```

**Payload:**
```json
{
  "url": "https://lztmarketxyz-production.up.railway.app/webhook/pix",
  "eventos": [
    "pix.recebido",
    "cobranca.paga"
  ]
}
```

---

## 🔍 Alternativa: Webhook Automático

**Boa notícia:** A EfiBank pode enviar webhooks **automaticamente** quando você cria uma cobrança PIX!

### Como Funciona:

1. Quando você cria uma cobrança PIX via `/adicionarsaldo`
2. A EfiBank **automaticamente** envia webhook para a URL configurada
3. Não precisa configurar manualmente!

### Verificar se Está Configurado:

Quando você cria uma cobrança PIX, a resposta da API pode incluir:
```json
{
  "webhook": {
    "url": "https://sua-url.com/webhook/pix"
  }
}
```

---

## 🧪 Teste: Criar Cobrança e Verificar Webhook

### 1. Criar Transação de Teste

Use o comando `/adicionarsaldo` no Discord:
```
/adicionarsaldo valor:10
```

### 2. Verificar Logs do Railway

Após criar a cobrança, verifique os logs:
- Procure por `[WEBHOOK]`
- Se aparecer webhook recebido, está funcionando!

### 3. Se Não Receber Webhook

**Possíveis causas:**
- Webhook não está configurado na EfiBank
- URL não está acessível
- EfiBank não consegue acessar sua URL

---

## 📞 Contatar Suporte EfiBank

Se não encontrar onde configurar:

1. **Suporte EfiBank:**
   - Email: suporte@efipay.com.br
   - Telefone: (verifique no site)
   - Chat: https://app.sejaefi.com.br/

2. **Pergunte:**
   - "Como configurar URL de webhook para receber notificações PIX?"
   - "Onde configuro webhook no painel?"
   - "Como configurar webhook via API?"

---

## ✅ Solução Temporária: Processamento Manual

**Enquanto não configura o webhook:**

Você pode processar pagamentos manualmente usando:
```
/admin liberar-saldo transaction_id:pix_xxx
```

Isso permite que o sistema funcione mesmo sem webhook automático.

---

## 🎯 Próximos Passos

1. **Tentar encontrar no painel** (vários locais possíveis)
2. **Verificar documentação da API** da EfiBank
3. **Contatar suporte** se não encontrar
4. **Usar processamento manual** temporariamente

---

## 💡 Dica

**Muitas vezes o webhook é configurado automaticamente** quando você cria a primeira cobrança PIX. Tente criar uma cobrança de teste e verificar se o webhook chega automaticamente!

---

## 🔍 Verificar se Webhook Está Funcionando

### Teste Manual no Postman:

**Método:** `POST`  
**URL:** `https://lztmarketxyz-production.up.railway.app/webhook/pix`  
**Body:**
```json
{
  "evento": "pix.recebido",
  "txid": "pix_test_123",
  "data": {
    "txid": "pix_test_123",
    "status": "CONCLUIDA",
    "valor": {
      "original": "10.00"
    }
  }
}
```

**Se retornar `"received": true`, o webhook está funcionando!**

---

## 📝 Resumo

- ✅ Webhook servidor está funcionando
- ✅ URL pública está configurada
- ⏳ Falta configurar na EfiBank (pode ser automático ou via API)
- ✅ Processamento manual disponível como alternativa

