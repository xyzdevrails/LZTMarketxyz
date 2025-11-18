# 🧪 Como Testar Webhooks no Postman

## 📍 Testando Localmente

### Pré-requisitos:
1. Bot rodando localmente (`npm run dev`)
2. Variável `WEBHOOK_ENABLED=true` no `.env`
3. Postman instalado

### Endpoints Disponíveis:

#### 1. **Health Check**
```
GET http://localhost:3000/health
```

**No Postman:**
- Método: `GET`
- URL: `http://localhost:3000/health`
- Headers: (nenhum necessário)

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "webhook-server"
}
```

---

#### 2. **Teste de Webhook**
```
POST http://localhost:3000/webhook/test
```

**No Postman:**
- Método: `POST`
- URL: `http://localhost:3000/webhook/test`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "test": "dados de teste",
    "valor": 100.50,
    "txid": "pix_teste_123"
  }
  ```

**Resposta esperada:**
```json
{
  "message": "Test webhook received",
  "body": {
    "test": "dados de teste",
    "valor": 100.50,
    "txid": "pix_teste_123"
  }
}
```

---

#### 3. **Webhook PIX (Simulação)**
```
POST http://localhost:3000/webhook/pix
```

**No Postman:**
- Método: `POST`
- URL: `http://localhost:3000/webhook/pix`
- Headers:
  ```
  Content-Type: application/json
  ```

- Body (raw JSON) - Exemplo de payload da EfiBank:
  ```json
  {
    "evento": "pix.pagamento",
    "horario": "2025-11-18T01:00:00Z",
    "txid": "pix_827292b4-3d7e-42e8-9387-edcc506aca90",
    "valor": {
      "original": "100.00"
    },
    "endToEndId": "E12345678202511180100000000000001",
    "devolucoes": []
  }
  ```

**Resposta esperada:**
```json
{
  "received": true
}
```

**O que acontece:**
- O webhook recebe a requisição
- Loga no console do bot
- Responde 200 OK
- **Por enquanto não processa** (isso vem nos próximos passos)

---

## 🌐 Testando no Railway (Produção)

### Pré-requisitos:
1. Bot deployado no Railway
2. Porta 3000 exposta publicamente
3. URL pública configurada (ex: `https://seu-bot.railway.app`)

### Como Expor Porta no Railway:

1. **No Railway Dashboard:**
   - Vá em **Settings** do seu projeto
   - Procure por **"Public Networking"** ou **"Ports"**
   - Adicione porta `3000` como pública
   - Railway gerará uma URL pública (ex: `https://seu-bot.up.railway.app`)

2. **Configure variável de ambiente:**
   ```env
   WEBHOOK_PORT=3000
   WEBHOOK_ENABLED=true
   ```

3. **Use a URL pública no Postman:**
   ```
   POST https://seu-bot.up.railway.app/webhook/pix
   ```

---

## 📋 Coleção do Postman (Importável)

Você pode criar uma coleção no Postman com todos os endpoints:

### Coleção JSON (copie e importe no Postman):

```json
{
  "info": {
    "name": "LZT Market Bot - Webhooks",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Test Webhook",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"test\": \"dados de teste\",\n  \"valor\": 100.50\n}"
        },
        "url": {
          "raw": "http://localhost:3000/webhook/test",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["webhook", "test"]
        }
      }
    },
    {
      "name": "Webhook PIX (Simulação)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"evento\": \"pix.pagamento\",\n  \"horario\": \"2025-11-18T01:00:00Z\",\n  \"txid\": \"pix_827292b4-3d7e-42e8-9387-edcc506aca90\",\n  \"valor\": {\n    \"original\": \"100.00\"\n  },\n  \"endToEndId\": \"E12345678202511180100000000000001\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/webhook/pix",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["webhook", "pix"]
        }
      }
    }
  ]
}
```

### Como Importar:
1. Abra o Postman
2. Clique em **Import**
3. Cole o JSON acima
4. Clique em **Import**

---

## 🔍 Verificando se Está Funcionando

### 1. Verifique os Logs do Bot:

Quando você enviar uma requisição no Postman, deve aparecer nos logs:

```
[WEBHOOK] POST /webhook/pix - IP: ::ffff:127.0.0.1
[WEBHOOK] Recebido webhook PIX: { ... dados ... }
```

### 2. Verifique a Resposta no Postman:

- Status: `200 OK`
- Body: `{"received": true}`

### 3. Se Não Funcionar:

**Erro: "Connection refused"**
- ✅ Verifique se o bot está rodando (`npm run dev`)
- ✅ Verifique se `WEBHOOK_ENABLED=true` no `.env`
- ✅ Verifique se a porta 3000 está livre

**Erro: "Cannot GET /webhook/pix"**
- ✅ Use `POST` ao invés de `GET`
- ✅ Verifique a URL correta

**Erro: "ECONNREFUSED"**
- ✅ Verifique se o servidor webhook iniciou (veja logs)
- ✅ Verifique se a porta está correta

---

## 💡 Dicas:

1. **Use variáveis no Postman:**
   - Crie variável `base_url` = `http://localhost:3000`
   - Use `{{base_url}}/webhook/pix` nas requisições
   - Facilita trocar entre local e produção

2. **Salve requisições:**
   - Crie uma coleção para organizar
   - Facilita testes repetidos

3. **Monitore os logs:**
   - Deixe o terminal do bot visível
   - Veja em tempo real o que está sendo recebido

---

## 🚀 Próximos Passos:

Após confirmar que está recebendo no Postman:
1. ✅ Configurar URL pública no Railway
2. ✅ Configurar webhook no painel da EfiBank
3. ✅ Implementar validação e processamento

