# 🚀 Webhook Automático - Guia Completo

## 📋 O Que Precisamos Para Automatizar?

Para ter o fluxo **100% automático**:

```
Cliente adiciona saldo → Dinheiro cai na EfiBank → Webhook automático → Saldo adicionado
```

Precisamos de **3 coisas**:

---

## ✅ 1. Registrar Webhook na EfiBank (Via API)

A EfiBank **não tem opção no painel** para configurar webhook. Precisa ser feito **via API**.

**Endpoint:** `PUT /v2/webhook/:chave`

**O que precisa:**
- ✅ Permissão `webhook.write` nas credenciais da EfiBank
- ✅ Chave PIX (que você já tem: `EFI_PIX_KEY`)
- ✅ URL pública HTTPS do seu webhook (Railway já fornece)

---

## ✅ 2. Configurar mTLS (Mutual TLS) - OPCIONAL

A EfiBank **recomenda** usar mTLS para segurança, mas **não é obrigatório**.

### Opção A: Com mTLS (Mais Seguro) 🔒

**O que precisa:**
- Certificado SSL do seu domínio (Railway já fornece)
- Certificado público da EfiBank baixado e configurado no servidor

**Problema:** Railway não permite configurar certificados customizados facilmente.

### Opção B: Skip-mTLS (Mais Fácil) ✅ **RECOMENDADO**

**O que precisa:**
- Validar IP da EfiBank: `34.193.116.226`
- Adicionar hash na URL do webhook (opcional, mas recomendado)

**Vantagem:** Funciona no Railway sem configuração extra!

---

## ✅ 3. Endpoint `/webhook/pix` Funcionando

**Status:** ✅ **JÁ TEMOS ISSO!**

O servidor webhook já está configurado e funcionando.

---

## 🎯 Solução: Implementar Registro Automático de Webhook

Vou criar uma função que:

1. **Registra o webhook automaticamente** quando o bot inicia
2. **Usa skip-mTLS** (mais fácil no Railway)
3. **Valida IP** da EfiBank para segurança
4. **Funciona automaticamente** sem intervenção manual

---

## 📝 O Que Vou Implementar

### 1. Método `registerWebhook()` no `EfiService`
- Registra webhook via API da EfiBank
- Usa skip-mTLS para facilitar
- Valida se já está registrado antes

### 2. Validação de IP no `WebhookServer`
- Aceita apenas requisições do IP da EfiBank
- Rejeita outras requisições automaticamente

### 3. Registro Automático no `index.ts`
- Registra webhook quando o bot inicia
- Loga sucesso/erro para debug

---

## 🔧 Requisitos Técnicos

### Permissões Necessárias na EfiBank:

Você precisa ter a permissão **"Alterar Webhooks"** habilitada nas suas credenciais.

**Como verificar:**
1. Acesse o painel da EfiBank (https://app.efipay.com.br)
2. Vá em "Aplicações" ou "API"
3. Encontre suas credenciais (CLIENT_ID)
4. Verifique se **"Alterar Webhooks"** está habilitado
5. Se não estiver, habilite ou peça para habilitarem

**📋 Veja o guia completo:** `PERMISSOES_WEBHOOK_EFIBANK.md`

### Variáveis de Ambiente:

```env
# Já temos:
EFI_CLIENT_ID=xxx
EFI_CLIENT_SECRET=xxx
EFI_PIX_KEY=xxx
EFI_SANDBOX=true/false

# Já temos (Railway):
RAILWAY_PUBLIC_DOMAIN=xxx.up.railway.app
PORT=3000

# Nova (opcional, para hash):
WEBHOOK_HMAC_SECRET=seu_hash_secreto_aqui
```

---

## 🚀 Fluxo Final (Após Implementação)

1. **Bot inicia** → Registra webhook automaticamente na EfiBank
2. **Cliente usa `/adicionarsaldo`** → Cria cobrança PIX
3. **Cliente paga** → Dinheiro cai na EfiBank
4. **EfiBank detecta pagamento** → Envia webhook para `/webhook/pix`
5. **Bot recebe webhook** → Valida IP → Processa pagamento
6. **Saldo adicionado automaticamente** → Cliente recebe DM confirmando

**Tudo automático!** 🎉

---

## ⚠️ Importante

### Sobre o `/pix` no final da URL:

A EfiBank **adiciona automaticamente `/pix`** no final da URL registrada.

**Exemplo:**
- Você registra: `https://seu-dominio.com/webhook`
- EfiBank envia para: `https://seu-dominio.com/webhook/pix`

**Solução:** Já temos o endpoint `/webhook/pix` configurado! ✅

### Sobre skip-mTLS:

Quando usar skip-mTLS, você precisa validar:
1. **IP da EfiBank:** `34.193.116.226`
2. **Hash na URL** (opcional, mas recomendado)

Vou implementar validação de IP automaticamente.

---

## 📊 Status Atual

- ✅ Servidor webhook funcionando
- ✅ Endpoint `/webhook/pix` configurado
- ✅ Processamento de webhook implementado
- ⏳ **Falta:** Registrar webhook na EfiBank via API
- ⏳ **Falta:** Validar IP da EfiBank

---

## 🎯 Próximos Passos

1. Implementar `registerWebhook()` no `EfiService`
2. Adicionar validação de IP no `WebhookServer`
3. Registrar webhook automaticamente no `index.ts`
4. Testar em SANDBOX primeiro
5. Depois testar em PRODUÇÃO

---

## 💡 Dúvidas?

**P: Preciso configurar algo manualmente?**
R: Não! Tudo será automático. Só precisa ter a permissão `webhook.write` habilitada.

**P: Funciona no Railway?**
R: Sim! Railway já fornece HTTPS e domínio público. Perfeito para webhooks.

**P: E se não tiver a permissão `webhook.write`?**
R: Você precisa habilitar no painel da EfiBank ou pedir para habilitarem.

**P: Posso testar antes?**
R: Sim! Vou implementar e você pode testar em SANDBOX primeiro.

---

## ✅ Vamos Implementar?

Posso implementar tudo agora! Só preciso confirmar:

1. ✅ Você tem a permissão `webhook.write` habilitada?
2. ✅ Quer que eu implemente agora?

Se sim, vou criar tudo e você só precisa testar! 🚀

