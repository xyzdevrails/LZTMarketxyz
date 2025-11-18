# 🧪 Teste Local do Webhook

## 📋 Pré-requisitos

1. ✅ Bot rodando localmente (`npm run dev`)
2. ✅ Variáveis configuradas no `.env`:
   ```env
   WEBHOOK_ENABLED=true
   WEBHOOK_PORT=3000
   EFI_CLIENT_ID=seu_client_id
   EFI_CLIENT_SECRET=seu_client_secret
   ```
3. ✅ Certificado EfiBank configurado (para criar transações)

---

## 🎯 Objetivo do Teste

Verificar se o webhook:
1. ✅ Recebe requisições corretamente
2. ✅ Extrai txid do payload
3. ✅ Identifica pagamento confirmado
4. ✅ Confirma pagamento via BalanceService
5. ✅ Adiciona saldo ao usuário
6. ✅ Envia DM ao usuário

---

## 📝 Passo a Passo

### 1. Criar uma Transação PIX de Teste

1. No Discord, use o comando:
   ```
   /adicionarsaldo valor:10
   ```

2. Confirme o pagamento (clique "Confirmar")

3. **Copie o ID da transação** que aparece no embed (ex: `pix_827292b4-3d7e-42e8-9387-edcc506aca90`)

4. **Anote o ID do usuário** (seu próprio ID ou use `@você` no Discord)

---

### 2. Simular Webhook no Postman

#### Opção A: Payload Simples (Recomendado para teste)

**Método:** `POST`  
**URL:** `http://localhost:3000/webhook/pix`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "evento": "pix.pagamento",
  "horario": "2025-11-18T01:00:00Z",
  "txid": "pix_827292b4-3d7e-42e8-9387-edcc506aca90",
  "valor": {
    "original": "10.00"
  },
  "endToEndId": "E12345678202511180100000000000001"
}
```

**⚠️ IMPORTANTE:** Substitua `pix_827292b4-3d7e-42e8-9387-edcc506aca90` pelo ID da transação que você copiou!

---

#### Opção B: Payload Completo (Mais Realista)

```json
{
  "evento": "pix.pagamento",
  "horario": "2025-11-18T01:00:00Z",
  "txid": "pix_827292b4-3d7e-42e8-9387-edcc506aca90",
  "valor": {
    "original": "10.00"
  },
  "endToEndId": "E12345678202511180100000000000001",
  "pix": [
    {
      "endToEndId": "E12345678202511180100000000000001",
      "txid": "pix_827292b4-3d7e-42e8-9387-edcc506aca90",
      "valor": "10.00",
      "horario": "2025-11-18T01:00:00Z"
    }
  ],
  "devolucoes": []
}
```

---

### 3. Verificar Resultados

#### ✅ O que deve acontecer:

1. **No Postman:**
   - Status: `200 OK`
   - Resposta: `{"received": true, "processed": true, ...}`

2. **Nos Logs do Bot:**
   ```
   [WEBHOOK] Recebido webhook PIX
   [WEBHOOK] Txid extraído: pix_xxx
   [WEBHOOK] Pagamento confirmado com sucesso: pix_xxx - R$ 10.00
   [WEBHOOK] DM enviada ao usuário xxx sobre pagamento pix_xxx
   ```

3. **No Discord:**
   - Você deve receber uma DM do bot confirmando o pagamento
   - Use `/meusaldo` para verificar se o saldo foi adicionado

---

## 🔍 Verificações

### Checklist de Teste:

- [ ] Webhook recebeu a requisição (status 200)
- [ ] Logs mostram txid extraído corretamente
- [ ] Logs mostram "Pagamento confirmado com sucesso"
- [ ] Saldo foi adicionado ao usuário (`/meusaldo`)
- [ ] DM foi enviada ao usuário
- [ ] Transação aparece como "paid" (`/admin historico-pix`)

---

## 🐛 Troubleshooting

### Erro: "Transação não encontrada"

**Causa:** O txid no payload não corresponde a nenhuma transação criada.

**Solução:**
1. Verifique se você copiou o txid correto da transação
2. Use `/admin historico-pix` para ver todas as transações
3. Use `/admin detalhes-pix` para ver o txid exato

---

### Erro: "Transação já foi processada"

**Causa:** Você já testou esse txid antes.

**Solução:**
1. Crie uma nova transação (`/adicionarsaldo`)
2. Use o novo txid no teste

---

### DM não foi enviada

**Possíveis causas:**
- Usuário tem DMs bloqueadas
- Bot não tem permissão para enviar DM
- Erro ao buscar usuário

**Verificação:**
- Veja os logs para mensagens de erro
- Tente enviar DM manualmente para o usuário

---

### Saldo não foi adicionado

**Verificação:**
1. Veja os logs para erros
2. Use `/admin detalhes-pix` para ver status da transação
3. Verifique se transação está como "paid"

---

## 💡 Dicas

1. **Use transações pequenas** para teste (ex: R$ 1,00 ou R$ 10,00)
2. **Monitore os logs** em tempo real enquanto testa
3. **Teste com diferentes formatos** de payload para garantir robustez
4. **Anote os txids** que você testou para referência

---

## 📊 Exemplo de Teste Completo

### 1. Criar Transação:
```
/adicionarsaldo valor:5
→ Copiar txid: pix_abc123...
```

### 2. Enviar Webhook:
```bash
POST http://localhost:3000/webhook/pix
{
  "evento": "pix.pagamento",
  "txid": "pix_abc123..."
}
```

### 3. Verificar:
- ✅ Logs mostram processamento
- ✅ `/meusaldo` mostra +R$ 5,00
- ✅ DM recebida

---

## 🎉 Próximo Passo

Após confirmar que funciona localmente:
- Configurar URL pública no Railway
- Configurar webhook no painel da EfiBank
- Testar com pagamento real em sandbox

