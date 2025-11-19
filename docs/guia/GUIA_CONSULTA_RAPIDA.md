# 📚 Guia de Consulta Rápida - LZT Market Bot

> **Última atualização:** Novembro 2025  
> **Propósito:** Documentação rápida para consulta e troubleshooting

---

## 🎯 Visão Geral

Este bot Discord vende contas Valorant do LZT Market. Os clientes adicionam saldo via PIX, compram contas e recebem credenciais automaticamente.

**Fluxo Principal:**
1. Cliente adiciona saldo via `/adicionarsaldo`
2. Cliente escolhe uma conta e clica "Comprar"
3. Bot verifica saldo → debita → compra na LZT → envia credenciais via DM

---

## 💬 Comandos do Bot

### 👥 Comandos de Cliente (Qualquer Usuário)

#### `/adicionarsaldo valor:100`
**O que faz:** Adiciona saldo à conta do usuário via PIX

**Como funciona:**
1. Usuário informa o valor (ex: `100` para R$ 100,00)
2. Bot mostra confirmação com botões "Confirmar" / "Cancelar"
3. Se confirmar, gera QR Code PIX
4. Usuário paga o PIX
5. Admin confirma pagamento ou webhook confirma automaticamente
6. Saldo é adicionado à conta

**Validações:**
- Valor mínimo: R$ 1,00
- Não aceita zeros à esquerda (ex: `0001` ❌)
- Aceita: `1`, `10`, `50`, `100`, `1.50`, `10.99` ✅

**Onde usar:** Canal fixo de adicionar saldo

---

#### `/meusaldo`
**O que faz:** Mostra saldo atual e últimas transações

**O que mostra:**
- Saldo atual em reais
- Últimas 5 transações (créditos/débitos)
- Dica para adicionar saldo (se não tiver transações)

**Onde usar:** Qualquer canal

---

#### `/contas quantidade:10`
**O que faz:** Lista contas Valorant disponíveis

**Filtros disponíveis:**
- `quantidade`: Quantas contas mostrar (padrão: 10)
- `preco_min`: Preço mínimo (ex: `preco_min:50`)
- `preco_max`: Preço máximo (ex: `preco_max:200`)

**Onde usar:** Canal de vendas

---

#### `/conta item_id:12345`
**O que faz:** Mostra detalhes completos de uma conta específica

**O que mostra:**
- Skins, rank, nível, risco
- Preço e disponibilidade
- Botão "Comprar" se disponível

**Onde usar:** Canal de vendas

---

### 🔐 Comandos de Admin (Apenas Administradores)

#### 📦 Grupo: Gerenciamento de Compras

##### `/admin finalizar-compra pedido_id:xxx`
**O que faz:** Finaliza compra e entrega conta Valorant ao cliente

**Quando usar:** Quando cliente pagou e você quer entregar a conta

**O que acontece:**
1. Bot verifica se conta ainda está disponível
2. Compra conta na LZT usando saldo do bot
3. Envia credenciais via DM ao cliente
4. Marca pedido como concluído

**⚠️ Importante:** Verifique se o cliente realmente pagou antes!

---

##### `/admin compras-pendentes`
**O que faz:** Lista todas as compras de contas pendentes

**O que mostra:**
- ID do pedido
- Usuário que comprou
- Valor e data
- Status

**Quando usar:** Para ver o que precisa ser entregue

---

#### 💰 Grupo: Gerenciamento de Saldo/PIX

##### `/admin historico-pix status:Pendentes`
**O que faz:** Lista histórico de transações PIX

**Filtros:**
- `status:Todas` - Todas as transações
- `status:Pendentes` - Apenas pendentes
- `status:Pagas` - Apenas pagas

**Quando usar:** Para ver quem pagou, quem está pendente, etc.

---

##### `/admin detalhes-pix transaction_id:pix_xxx`
**O que faz:** Mostra detalhes completos de uma transação PIX específica

**O que mostra:**
- ID da transação
- Usuário
- Valor e status
- Datas (criação, pagamento)
- Chave PIX
- TXID da EfiBank

**Quando usar:** Para investigar uma transação específica

---

##### `/admin liberar-saldo transaction_id:pix_xxx`
**O que faz:** Confirma pagamento PIX e libera saldo para o usuário

**Quando usar:** Quando recebeu pagamento PIX e quer adicionar saldo manualmente

**O que acontece:**
1. Marca transação como "paid"
2. Adiciona saldo ao usuário
3. Envia DM ao usuário confirmando
4. Mostra novo saldo do usuário

**⚠️ Importante:** Use apenas se webhook não confirmou automaticamente!

---

## 🌐 Endpoints HTTP (Webhook)

### Informações Gerais

O bot roda um servidor HTTP **junto com o Discord bot** para receber webhooks da EfiBank.

**Porta padrão:** `3000`  
**Variável de ambiente:** `WEBHOOK_PORT=3000`

---

### Endpoints Disponíveis

#### `GET /health`
**O que faz:** Health check do servidor

**Resposta:**
```json
{
  "status": "ok",
  "service": "webhook-server"
}
```

**Quando usar:** Para verificar se servidor está rodando

---

#### `POST /webhook/pix`
**O que faz:** Recebe notificações de pagamento PIX da EfiBank

**Status atual:** ✅ Recebe e loga (processamento será implementado)

**O que acontece:**
- Recebe payload da EfiBank
- Loga tudo nos logs do bot
- Responde 200 OK

**Quando usar:** Configurar no painel da EfiBank

**URL de produção:** `https://seu-bot.railway.app/webhook/pix`

---

#### `POST /webhook/test`
**O que faz:** Endpoint de teste manual

**Quando usar:** Para testar se webhook está funcionando (Postman, etc.)

---

## 🚂 Railway (Deploy)

### Variáveis de Ambiente Importantes

#### Discord
```env
DISCORD_BOT_TOKEN=seu_token_aqui
```

#### LZT Market
```env
LZT_API_TOKEN=seu_token_aqui
LZT_API_BASE_URL=https://prod-api.lzt.market
```

#### EfiBank (PIX)
```env
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_PIX_KEY=sua_chave_pix
EFI_SANDBOX=true  # ou false para produção
EFI_CERTIFICATE_BASE64=base64_do_certificado
EFI_CERTIFICATE_PASSWORD=senha_do_certificado  # opcional
```

#### Webhook
```env
WEBHOOK_ENABLED=true
WEBHOOK_PORT=3000
```

---

### Como Fazer Deploy

1. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "sua mensagem"
   git push origin main
   ```

2. **Railway detecta automaticamente** e faz deploy

3. **Verifique os logs** no Railway Dashboard

4. **Aguarde 5-15 minutos** para Discord atualizar comandos

---

### Expor Porta do Webhook no Railway

1. Vá em **Settings** do projeto
2. Procure **"Public Networking"** ou **"Ports"**
3. Adicione porta `3000` como pública
4. Railway gerará URL pública (ex: `https://seu-bot.up.railway.app`)

**⚠️ Importante:** Use essa URL para configurar webhook na EfiBank!

---

## 🔗 Webhook EfiBank

### Como Funciona

1. Cliente paga PIX
2. EfiBank envia notificação para `/webhook/pix`
3. Bot processa e adiciona saldo automaticamente
4. Usuário recebe DM confirmando

### Status Atual

- ✅ Servidor HTTP criado
- ✅ Endpoint `/webhook/pix` recebendo requisições
- ⏳ Processamento automático (em desenvolvimento)
- ⏳ Validação de assinatura (em desenvolvimento)

### Por Enquanto

Se webhook não estiver funcionando, use:
```
/admin liberar-saldo transaction_id:pix_xxx
```

---

## 📁 Arquivos Importantes

### Arquivos JSON (no servidor Railway)

- `orders.json` - Pedidos de compra
- `user_balances.json` - Saldos dos usuários
- `pix_transactions.json` - Transações PIX
- `published_accounts.json` - Contas publicadas (futuro)
- `purchase_logs.json` - Logs de compras (futuro)

**⚠️ Importante:** Esses arquivos ficam no servidor, não no seu computador!

**Como ver:** Use comandos admin ou acesse Railway terminal

---

## 🔍 Troubleshooting Rápido

### Bot não responde comandos
- ✅ Verifique se está online no Discord
- ✅ Verifique logs no Railway
- ✅ Aguarde 5-15 min após deploy (Discord atualiza comandos)

### Webhook não conecta
- ✅ Verifique `WEBHOOK_ENABLED=true` no Railway
- ✅ Verifique se porta 3000 está exposta
- ✅ Verifique logs do bot

### Comando `/adicionarsaldo` não aparece
- ✅ Verifique se `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` estão configurados
- ✅ Aguarde Discord atualizar (pode levar até 1 hora)

### Transação PIX não confirma
- ✅ Verifique se webhook está configurado na EfiBank
- ✅ Use `/admin liberar-saldo` manualmente se necessário
- ✅ Verifique logs para erros

### Erro "Certificado não encontrado"
- ✅ Configure `EFI_CERTIFICATE_BASE64` no Railway
- ✅ Verifique se certificado corresponde ao ambiente (sandbox/produção)

---

## 📝 Notas Importantes

### Sandbox vs Produção

- **Sandbox:** QR Codes não podem ser pagos com dinheiro real
- **Produção:** QR Codes são reais e podem ser pagos
- **Certificado:** Deve corresponder ao ambiente (sandbox ou produção)

### Segurança

- ⚠️ **Nunca** commite arquivos `.env` ou certificados no Git
- ⚠️ **Sempre** use variáveis de ambiente no Railway
- ⚠️ **Valide** pagamentos antes de entregar contas

### Fluxo de Compra Completo

1. Cliente adiciona saldo (`/adicionarsaldo`)
2. Cliente escolhe conta (`/contas` ou `/conta`)
3. Cliente clica "Comprar"
4. Bot verifica saldo → debita → compra na LZT
5. Bot envia credenciais via DM
6. Se compra falhar, reembolsa automaticamente

---

## 🆘 Contatos e Recursos

### Documentação Externa

- **EfiBank:** https://dev.efipay.com.br/docs/api-pix
- **LZT Market API:** (consulte documentação oficial)
- **Discord.js:** https://discord.js.org/

### Arquivos de Documentação do Projeto

- `README.md` - Visão geral do projeto
- `docs/planejamento/MELHORIAS_PRODUCAO.md` - Melhorias pendentes
- `docs/guia/EXPLICACAO_SIMPLES.md` - Explicações simples
- `docs/configuracao/CERTIFICADOS_README.md` - Configuração de certificados

---

## 💡 Dicas Rápidas

1. **Sempre verifique logs** quando algo não funcionar
2. **Teste em sandbox** antes de produção
3. **Backup dos arquivos JSON** periodicamente
4. **Monitore transações pendentes** regularmente
5. **Use comandos admin** para investigar problemas

---

**Última atualização:** Novembro 2025  
**Mantido por:** Equipe de Desenvolvimento

