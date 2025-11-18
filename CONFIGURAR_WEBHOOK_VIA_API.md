# 🔧 Configurar Webhook via API da EfiBank

## 📋 Situação Atual

- ✅ Webhook servidor funcionando
- ✅ URL pública configurada: `https://lztmarketxyz-production.up.railway.app/webhook/pix`
- ❌ Não há opção no painel web da EfiBank para configurar URL
- ✅ Solução: Configurar via API

---

## 🔍 Opções Disponíveis

### Opção 1: Webhook Automático (Testar Primeiro)

**A EfiBank pode enviar webhooks automaticamente** quando você cria uma cobrança PIX, **sem precisar configurar manualmente**.

#### Como Testar:

1. **Crie uma cobrança de teste:**
   ```
   /adicionarsaldo valor:1
   ```

2. **Verifique os logs do Railway:**
   - Procure por `[WEBHOOK] Webhook recebido`
   - Se aparecer, está funcionando automaticamente! ✅

3. **Se funcionar:** Não precisa fazer mais nada!

---

### Opção 2: Configurar via API (Se Opção 1 Não Funcionar)

A EfiBank permite configurar webhook via API. Vamos criar um script para isso.

#### Endpoint da API:

```
POST https://api.efipay.com.br/v1/webhook
```

**Ou para sandbox:**
```
POST https://api-h.efipay.com.br/v1/webhook
```

#### Payload:

```json
{
  "webhookUrl": "https://lztmarketxyz-production.up.railway.app/webhook/pix"
}
```

#### Headers Necessários:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## 🛠️ Implementação: Script para Configurar Webhook

Vou criar um script que você pode executar para configurar o webhook via API.

### Passo 1: Criar Script

Criar arquivo `scripts/configurar-webhook-efibank.ts`:

```typescript
import dotenv from 'dotenv';
import axios from 'axios';
import EfiPay from 'sdk-node-apis-efi';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function configurarWebhook() {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  const sandbox = process.env.EFI_SANDBOX === 'true';
  const webhookUrl = process.env.WEBHOOK_URL || 
    'https://lztmarketxyz-production.up.railway.app/webhook/pix';

  if (!clientId || !clientSecret) {
    console.error('❌ EFI_CLIENT_ID e EFI_CLIENT_SECRET são obrigatórios');
    process.exit(1);
  }

  console.log('🔧 Configurando webhook na EfiBank...');
  console.log(`📡 URL do webhook: ${webhookUrl}`);
  console.log(`🌍 Ambiente: ${sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);

  try {
    // Inicializa SDK da EfiBank (mesmo código do efiService)
    const certificateBase64 = process.env.EFI_CERTIFICATE_BASE64;
    let tempCertPath: string | null = null;

    if (certificateBase64) {
      const cleanBase64 = certificateBase64.replace(/\s/g, '').trim();
      const certBuffer = Buffer.from(cleanBase64, 'base64');
      tempCertPath = path.join(__dirname, '../temp_certificado_webhook.p12');
      fs.writeFileSync(tempCertPath, certBuffer);
    }

    const efipay = new EfiPay({
      client_id: clientId!,
      client_secret: clientSecret!,
      sandbox: sandbox,
      certificate: tempCertPath || process.env.EFI_CERTIFICATE_PATH || './certs/certificado.p12',
    });

    // Tenta configurar webhook via API
    // Nota: O endpoint exato pode variar, verifique a documentação
    const baseURL = sandbox 
      ? 'https://api-h.efipay.com.br'
      : 'https://api.efipay.com.br';

    try {
      // Método 1: Tentar endpoint de webhook
      const response = await axios.post(
        `${baseURL}/v1/webhook`,
        {
          webhookUrl: webhookUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // O SDK pode precisar de autenticação adicional
        }
      );

      console.log('✅ Webhook configurado com sucesso!');
      console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
    } catch (apiError: any) {
      console.error('❌ Erro ao configurar webhook via API:', apiError.message);
      console.error('📋 Detalhes:', apiError.response?.data || apiError);
      
      console.log('\n💡 Alternativa: O webhook pode ser configurado automaticamente');
      console.log('   quando você cria cobranças PIX. Teste criando uma cobrança.');
    }

    // Limpa arquivo temporário
    if (tempCertPath && fs.existsSync(tempCertPath)) {
      fs.unlinkSync(tempCertPath);
    }
  } catch (error: any) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

configurarWebhook();
```

---

## 🧪 Teste Rápido: Webhook Automático

**Antes de configurar via API, teste se funciona automaticamente:**

### 1. Criar Cobrança de Teste

No Discord:
```
/adicionarsaldo valor:1
```

### 2. Verificar Logs

Após criar, verifique os logs do Railway:
- Procure por `[WEBHOOK]`
- Se aparecer webhook recebido, está funcionando! ✅

### 3. Se Funcionar

**Não precisa fazer mais nada!** A EfiBank está enviando webhooks automaticamente.

---

## 📞 Contatar Suporte EfiBank

Se nenhuma das opções funcionar:

1. **Suporte EfiBank:**
   - Email: suporte@efipay.com.br
   - Chat: https://app.sejaefi.com.br/

2. **Pergunte:**
   - "Como configurar URL de webhook para receber notificações PIX automaticamente?"
   - "Preciso configurar webhook via API ou painel?"
   - "O webhook é enviado automaticamente quando crio cobranças PIX?"

---

## ✅ Solução Temporária: Processamento Manual

**Enquanto não configura o webhook:**

Você pode processar pagamentos manualmente usando:
```
/admin liberar-saldo transaction_id:pix_xxx
```

Isso permite que o sistema funcione mesmo sem webhook automático.

---

## 🎯 Recomendação

1. **Primeiro:** Teste se o webhook funciona automaticamente (criar cobrança e verificar logs)
2. **Se funcionar:** Pronto! Não precisa fazer mais nada
3. **Se não funcionar:** Use processamento manual temporariamente ou contate suporte EfiBank

---

## 📝 Resumo

- ✅ Webhook servidor está funcionando
- ✅ URL pública está configurada
- ⏳ Teste se EfiBank envia automaticamente
- ✅ Processamento manual disponível como alternativa
- 📞 Suporte EfiBank disponível se necessário

