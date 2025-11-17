# 🔐 Permissões Necessárias - EfiBank API

## ❌ Erro Atual: `insufficient_scope`

O erro `insufficient_scope` significa que sua aplicação não tem permissão para gerar QR Code.

## ✅ Permissões Obrigatórias

Você precisa marcar estas permissões no painel da EfiBank:

### API Pix (Primeira Tela):

1. ✅ **Alterar cobranças** - Para criar cobranças PIX
2. ✅ **Consultar cobranças** - Para verificar status de pagamento
3. ✅ **Consultar Pix** - Para consultar transações
4. ✅ **Enviar Pix** - Para reembolsos automáticos
5. ✅ **Alterar Webhooks** - Para configurar webhooks
6. ✅ **Consultar Webhooks** - Para verificar webhooks
7. ✅ **Consultar Payloads** - **OBRIGATÓRIA PARA QR CODE** ⚠️
8. ✅ **Alterar Payloads** - Pode ser necessária também

### ⚠️ Permissão Crítica:

**"Consultar Payloads"** é a permissão necessária para gerar QR Code usando o método `pixGenerateQRCode`.

## 📋 Como Verificar/Corrigir:

1. Acesse: https://app.sejaefi.com.br/
2. Vá em **"Configurações"** → **"API"** ou **"Aplicações"**
3. Encontre sua aplicação (a que tem o CLIENT_ID que você está usando)
4. Clique em **"Editar"** ou **"Permissões"**
5. Vá até a seção **"API Pix"**
6. **MARQUE** a permissão **"Consultar Payloads"** em **Produção** e **Homologação**
7. Salve as alterações

## 🔄 Após Alterar Permissões:

1. **Aguarde alguns minutos** - As permissões podem levar alguns minutos para serem aplicadas
2. **Teste novamente** o comando `/adicionarsaldo`
3. Se ainda não funcionar, verifique se todas as permissões acima estão marcadas

## 📝 Checklist Completo:

- [ ] Alterar cobranças (Produção ✅ / Homologação ✅)
- [ ] Consultar cobranças (Produção ✅ / Homologação ✅)
- [ ] Consultar Pix (Produção ✅ / Homologação ✅)
- [ ] Enviar Pix (Produção ✅ / Homologação ✅)
- [ ] Alterar Webhooks (Produção ✅ / Homologação ✅)
- [ ] Consultar Webhooks (Produção ✅ / Homologação ✅)
- [ ] **Consultar Payloads (Produção ✅ / Homologação ✅)** ← **CRÍTICO**
- [ ] Alterar Payloads (Produção ✅ / Homologação ✅) - Opcional mas recomendado

## 💡 Nota:

Se você já marcou essas permissões mas ainda está recebendo o erro:
- Aguarde 5-10 minutos para as permissões serem propagadas
- Verifique se está usando as credenciais corretas (sandbox vs produção)
- Certifique-se de que o certificado corresponde ao ambiente

