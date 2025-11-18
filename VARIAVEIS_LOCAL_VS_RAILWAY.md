# 🔄 Variáveis Locais vs Railway

## ⚠️ Importante: Ambientes Separados

**Railway (Produção)** e **Local (.env)** são ambientes **completamente separados**!

- ✅ Variáveis no Railway → Só funcionam no Railway
- ✅ Variáveis no `.env` → Só funcionam localmente
- ❌ Variáveis no Railway **NÃO** aparecem localmente

---

## 📋 Para Testar Localmente

Você precisa adicionar as variáveis no seu `.env` local também!

### Opção 1: Copiar do Railway (Recomendado)

1. **Acesse Railway Dashboard:**
   - Vá em **Variables**
   - Copie o valor de `EFI_CERTIFICATE_BASE64`

2. **Adicione no `.env` local:**
   ```env
   EFI_CERTIFICATE_BASE64=<cole_o_valor_copiado_do_railway>
   ```

3. **⚠️ IMPORTANTE:** 
   - Cole **TUDO** em uma linha só
   - Sem quebras de linha
   - Sem espaços extras

---

### Opção 2: Usar Arquivo Local (Mais Fácil)

Você já tem os arquivos base64 no projeto:

1. **Para SANDBOX (testes):**
   ```env
   EFI_CERTIFICATE_BASE64=<conteudo_de_certificado-homologacao_base64.txt>
   ```

2. **Para PRODUÇÃO:**
   ```env
   EFI_CERTIFICATE_BASE64=<conteudo_de_certificado-producao_base64.txt>
   ```

**Como fazer:**
1. Abra `certificado-homologacao_base64.txt` (ou produção)
2. Selecione TODO (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no `.env`:
   ```env
   EFI_CERTIFICATE_BASE64=MIIKXWIBAZCCCiUGCSqGSIb3DQEHAaCCChYEggoSMIIKDjCCBMUGCSqGSIb3DQEHAAC...
   ```

---

## 🧪 Para Testar Webhook (Sem Certificado)

**Boa notícia:** Para testar o webhook recebendo requisições, você **NÃO precisa** do certificado!

O certificado só é necessário para:
- ✅ Criar transações PIX (`/adicionarsaldo`)
- ✅ Gerar QR Codes

Para testar webhook recebendo:
- ✅ Só precisa `WEBHOOK_ENABLED=true`
- ✅ Webhook recebe e loga (mesmo sem certificado)

---

## 📝 Exemplo de `.env` Local Completo

```env
# Discord
DISCORD_BOT_TOKEN=seu_token_discord

# LZT Market
LZT_API_TOKEN=seu_token_lzt
LZT_API_BASE_URL=https://prod-api.lzt.market

# EfiBank (SANDBOX para testes)
EFI_CLIENT_ID=Client_Id_89f7c76497d583d6f617b3624d850cc2154d9a45
EFI_CLIENT_SECRET=Client_Secret_6cabf14f5b5a0ce35ea795a5a548ded121315232
EFI_SANDBOX=true
EFI_PIX_KEY=sua_chave_pix
EFI_CERTIFICATE_BASE64=<cole_aqui_o_base64_do_certificado>

# Webhook
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000
```

---

## 🔍 Verificação

Após adicionar no `.env`, reinicie o bot e verifique os logs:

**✅ Se configurado corretamente:**
```
[EFI] EFI_CERTIFICATE_BASE64: SIM (12345 chars)
```

**❌ Se não configurado:**
```
[EFI] EFI_CERTIFICATE_BASE64: NÃO CONFIGURADO
```

---

## 💡 Dicas

1. **Para testes básicos:** Não precisa do certificado (webhook funciona sem ele)
2. **Para criar transações:** Precisa do certificado
3. **Use SANDBOX localmente:** Mais seguro para testes
4. **Railway usa produção:** Quando fizer deploy

---

## 🆘 Problemas Comuns

### "Certificado muito grande para colar"

**Solução:** Use o arquivo `.txt` que já tem no projeto:
```env
EFI_CERTIFICATE_BASE64=<abra_o_arquivo_e_cole_tudo>
```

### "Erro ao processar certificado"

**Verifique:**
- Não tem quebras de linha no meio
- Não tem espaços extras
- Está tudo em uma linha só

### "Funciona no Railway mas não localmente"

**Causa:** Variáveis diferentes entre ambientes

**Solução:** Copie as variáveis do Railway para `.env` local

