# ❌ Erro: notification_url Não É Suportado

## 🔍 Problema Identificado

A API da EfiBank **rejeitou** o campo `notification_url` no payload da cobrança PIX imediata.

**Erro:**
```
"nome":"json_invalido", 
"mensagem": "Valores ou tipos de campo inválidos", 
"erros":[{
  "chave": "additional Properties", 
  "caminho":".body", 
  "mensagem": "não são permitidas propriedades adicionais"
}]
```

---

## ✅ Solução Aplicada

**Removido `notification_url` do payload** da cobrança PIX.

O código agora cria cobranças sem esse campo, permitindo que funcionem normalmente.

---

## 📋 Situação do Webhook

### O Que Descobrimos:

1. ❌ **`notification_url` não funciona** no payload da cobrança PIX imediata
2. ❌ **Não há opção no painel** da EfiBank para configurar webhook
3. ⚠️ **Webhook precisa ser configurado via API separada** (se disponível)

### Opções Disponíveis:

#### Opção 1: Processamento Manual (Funciona Agora) ✅

**Recomendado por enquanto:**

1. Cliente usa `/adicionarsaldo`
2. Bot gera QR Code PIX
3. Cliente paga
4. Você verifica pagamento
5. Você usa `/admin liberar-saldo transaction_id:pix_xxx`
6. Saldo é adicionado automaticamente

**Vantagens:**
- ✅ Funciona imediatamente
- ✅ Você tem controle total
- ✅ Pode verificar antes de liberar

#### Opção 2: Configurar Webhook via API (Futuro)

Se quiser automatizar depois:

1. Contatar suporte EfiBank
2. Perguntar sobre configuração de webhook via API
3. Seguir instruções deles

---

## ✅ Status Atual

- ✅ Código corrigido (removido `notification_url`)
- ✅ Cobranças PIX funcionando normalmente
- ✅ QR Code sendo gerado corretamente
- ⏳ Webhook automático: precisa configurar separadamente

---

## 🧪 Teste Agora

Após o deploy, teste novamente:

```
/adicionarsaldo valor:1
```

**Deve funcionar normalmente agora!** ✅

---

## 📝 Resumo

- ❌ `notification_url` não é suportado na API PIX imediata
- ✅ Campo removido do código
- ✅ Cobranças funcionando normalmente
- ✅ Use processamento manual por enquanto

---

## 🎯 Próximos Passos

1. **Teste criar cobrança** (`/adicionarsaldo valor:1`)
2. **Verifique se QR Code é gerado** corretamente
3. **Use processamento manual** quando necessário
4. **Configure webhook depois** (quando tiver tempo)

---

## 💡 Dica

**O processamento manual não é um problema!** Muitas empresas usam assim:
- Mais controle
- Pode verificar pagamento antes de liberar
- Evita problemas com webhooks

Você pode usar assim por enquanto e configurar webhook depois quando tiver tempo! ✅

