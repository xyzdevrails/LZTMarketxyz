# 🗺️ Roadmap do Projeto - Bot Discord LZT Market

**Última atualização:** Janeiro 2025  
**Última revisão:** Janeiro 2025 - Adicionado bug crítico de atualização de status  
**Status:** ✅ Em Produção

---

## 📊 Status Geral

| Categoria | Status | Progresso |
|-----------|--------|-----------|
| **Funcionalidades Core** | ✅ Completo | 100% |
| **Sistema de Pagamento PIX** | ✅ Completo | 100% |
| **Webhook Automático** | ✅ Completo | 100% |
| **Sistema de Saldo** | ✅ Completo | 100% |
| **Comandos Administrativos** | ✅ Completo | 100% |
| **Compras Automáticas** | ⚠️ Parcial | 50% |
| **Publicação de Contas** | ❌ Pendente | 0% |

---

## ✅ CONCLUÍDO (Em Produção)

### 1. Sistema de Listagem de Contas ✅
- ✅ Comando `/contas` - Lista contas de Valorant disponíveis
- ✅ Filtros por preço (mínimo e máximo)
- ✅ Controle de quantidade (1-20 contas)
- ✅ Cards visuais com informações detalhadas
- ✅ Botões interativos (Comprar, Mais Informações)
- ✅ Código de identificação único (HYPE_XXXXXX)

### 2. Sistema de Detalhes de Conta ✅
- ✅ Comando `/conta <id>` - Mostra detalhes completos
- ✅ Informações de skins, rank, risco, etc.
- ✅ Embed formatado e organizado

### 3. Sistema de Pagamento PIX ✅
- ✅ Integração completa com EfiBank
- ✅ Comando `/adicionarsaldo` - Gera QR Code PIX
- ✅ Validação de valores (mínimo R$ 1,00)
- ✅ Geração de QR Code automática
- ✅ Chave PIX configurável (e-mail)
- ✅ Transações salvas em `pix_transactions.json`
- ✅ IDs únicos para cada transação

### 4. Webhook Automático PIX ✅
- ✅ Servidor HTTP Express implementado
- ✅ Endpoint `/webhook/pix` funcionando
- ✅ Registro automático de webhook na EfiBank
- ✅ Validação de IP (configurável)
- ✅ Processamento automático de pagamentos
- ✅ Adição automática de saldo após pagamento
- ✅ Notificação via DM ao usuário
- ✅ Logs detalhados de webhooks

### 5. Sistema de Saldo ✅
- ✅ Armazenamento de saldos por usuário
- ✅ Comando `/meusaldo` - Consulta saldo atual
- ✅ Histórico de transações (últimas 5)
- ✅ Crédito automático via webhook
- ✅ Débito para compras
- ✅ Reembolso automático em caso de falha

### 6. Comandos Administrativos ✅
- ✅ `/admin finalizar-compra` - Finaliza compra manual
- ✅ `/admin compras-pendentes` - Lista pedidos pendentes
- ✅ `/admin historico-pix` - Lista transações PIX
- ✅ `/admin detalhes-pix` - Detalhes de transação específica
- ✅ `/admin liberar-saldo` - Libera saldo manualmente
- ✅ Busca por `transaction_id` e `efi_txid`
- ✅ Lista transações pendentes quando não encontra

### 7. Infraestrutura e Deploy ✅
- ✅ Deploy no Railway
- ✅ Variáveis de ambiente configuradas
- ✅ Certificados SSL configurados
- ✅ Logs estruturados
- ✅ Tratamento de erros básico
- ✅ Rate limiting para API LZT (300 req/min)

---

## ⚠️ EM ANDAMENTO / PARCIAL

### 1. Sistema de Compra Automática com Saldo ⚠️
**Status:** Parcialmente implementado  
**Progresso:** 50%

**O que funciona:**
- ✅ Sistema de saldo completo
- ✅ Verificação de saldo suficiente
- ✅ Débito de saldo

**O que falta:**
- ❌ Botão "Comprar" ainda usa modal de comprovante manual
- ❌ Não verifica saldo antes de mostrar botão
- ❌ Não compra automaticamente quando tem saldo
- ❌ Não mostra saldo atual vs necessário no embed

**Próximos passos:**
1. Modificar `buttonHandler.ts` para verificar saldo antes de comprar
2. Se tiver saldo suficiente, mostrar modal de confirmação
3. Debitar saldo e comprar conta automaticamente
4. Enviar credenciais via DM
5. Implementar reembolso automático se compra falhar

---

## ❌ PENDENTE

### 1. Bug: Status de Transação PIX Não Atualiza Após Pagamento 🔴
**Prioridade:** 🔴 ALTA (BUG CRÍTICO)  
**Status:** Bug identificado - não corrigido

**Problema:**
- Após pagamento PIX ser aprovado e saldo creditado com sucesso, o status da transação permanece como `pending` ao invés de `paid`
- Ao consultar `/admin detalhes-pix`, o status sempre aparece como "Pending" mesmo após pagamento confirmado
- O saldo é creditado corretamente, mas o status não é atualizado no storage

**Impacto:** 
- Dificulta rastreamento de transações pagas
- Pode causar confusão ao verificar histórico
- Transações pagas podem ser marcadas como expiradas incorretamente pelo serviço de expiração

**Causa provável:**
- No método `confirmPixPayment` do `balanceService.ts`, quando a transação é encontrada por `efi_txid`, o `transactionId` usado para atualizar pode estar incorreto ou vazio
- Linha 108 usa `transactionId` do parâmetro, mas deveria usar `transaction.transaction_id` quando encontrado por `efi_txid`

**Implementação sugerida:**
- Corrigir `balanceService.confirmPixPayment()` para usar `transaction.transaction_id` ao invés do parâmetro `transactionId` quando a transação foi encontrada por `efi_txid`
- Garantir que o status seja sempre atualizado corretamente após confirmação de pagamento
- Adicionar validação para garantir que o status seja atualizado antes de creditar saldo
- Testar cenário onde webhook encontra transação por `efi_txid`

---

### 2. Validação de Expiração de Transações PIX ✅
**Prioridade:** 🔴 ALTA  
**Status:** ✅ IMPLEMENTADO (Janeiro 2025)

**Descrição:**
- ✅ Verificar transações PIX pendentes há mais de 1 hora
- ✅ Marcar como expiradas automaticamente
- ✅ Notificar usuário sobre expiração
- ✅ Limpar transações antigas periodicamente

**Implementação:**
- ✅ Job periódico que roda a cada 15 minutos
- ✅ Verifica `created_at` de transações pendentes
- ✅ Marca como `expired` se > 1 hora
- ✅ Envia DM ao usuário informando expiração

---

### 3. Comandos de Publicação de Contas ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

#### 3.1. Comando `/generate` ❌
**Descrição:**
- Publicar contas automaticamente conforme filtros
- Filtros: BR, 3+ skins, nível 20+
- Polling a cada 1 hora
- Evitar duplicatas
- Publicar no canal configurado

**Implementação sugerida:**
- Criar serviço `accountPublisher.ts`
- Job periódico que busca contas na API LZT
- Verificar se já foi publicada (usar `item_id`)
- Publicar no canal configurado via webhook ou bot

#### 3.2. Comando `/fa` ❌
**Descrição:**
- Publicar conta manualmente com preço customizado
- Validar que preço customizado > preço LZT
- Calcular lucro automaticamente
- Mostrar alerta se lucro muito baixo

**Implementação sugerida:**
- Comando `/fa <item_id> <preco_customizado>`
- Buscar conta na API LZT
- Validar preço
- Criar embed customizado
- Publicar no canal

---

### 4. Sistema de Backup Automático ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Backup automático dos arquivos JSON
  - `orders.json`
  - `user_balances.json`
  - `pix_transactions.json`
- Backup diário para storage externo
- Script de restauração

**Opções de implementação:**
- Railway Volume (persistente)
- S3 ou similar
- GitHub (privado)
- Backup manual via comando admin

**Impacto:** Perda de dados em caso de falha do servidor.

---

### 5. Melhorias de Tratamento de Erros ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Básico implementado

**O que falta:**
- ❌ Retry automático para falhas temporárias
- ❌ Logs estruturados com contexto (Winston/Pino)
- ❌ Notificações de erro para admins
- ❌ Canal Discord dedicado para erros críticos

**Implementação sugerida:**
- Migrar para Winston ou Pino
- Formato JSON para Railway
- Webhook para canal de erros
- Alertas para erros críticos

---

### 6. Validação de Saldo Antes de Comprar ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Verificar saldo antes de criar pedido
- Mostrar saldo atual e necessário no embed
- Botão "Comprar" desabilitado se saldo insuficiente
- Mensagem educativa quando saldo insuficiente

**Impacto:** Melhor UX e menos pedidos inválidos.

---

### 7. Rate Limiting para Comandos ❌
**Prioridade:** 🟢 BAIXA  
**Status:** Não implementado

**Descrição:**
- Limitar comandos por usuário (ex: 10 comandos/minuto)
- Prevenir spam e abuso
- Mensagem educativa quando limite atingido

**Impacto:** Previne abuso mas não é crítico.

---

### 8. Comando `/historico` para Usuários ❌
**Prioridade:** 🟢 BAIXA  
**Status:** Não implementado

**Descrição:**
- Ver histórico de transações próprias
- Ver histórico de compras
- Filtros por data, tipo, status

**Impacto:** Melhor UX mas não essencial.

---

### 9. Sistema de Estatísticas ❌
**Prioridade:** 🟢 BAIXA  
**Status:** Não implementado

**Descrição:**
- Comando `/admin estatisticas`
- Total de vendas, receita, usuários
- Gráficos simples (opcional)

**Impacto:** Útil para gestão mas não crítico.

---

## 🎯 Priorização Sugerida

### Semana 1-2: Compras Automáticas
1. ✅ Sistema de saldo (já feito)
2. ⏳ Modificar botão "Comprar" para usar saldo
3. ⏳ Verificação de saldo antes de comprar
4. ⏳ Compra automática quando tem saldo

### Semana 3: Correção de Bugs Críticos
1. 🔴 Corrigir bug de atualização de status de transações PIX
2. ✅ Validação de expiração de transações (CONCLUÍDO)

### Semana 4: Backup e Monitoramento
1. ⏳ Sistema de backup automático
2. ⏳ Logs estruturados
3. ⏳ Notificações de erro

### Semana 5+: Funcionalidades Adicionais
1. ⏳ Comandos `/generate` e `/fa`
2. ⏳ Rate limiting
3. ⏳ Histórico para usuários
4. ⏳ Estatísticas

---

## 📋 Checklist de Produção Atual

### ✅ Concluído
- [x] Webhook EfiBank implementado e testado
- [x] Sistema de saldo funcionando
- [x] Comandos administrativos completos
- [x] Deploy no Railway
- [x] Variáveis de ambiente configuradas
- [x] Certificado de produção configurado
- [x] Logs básicos funcionando

### ⏳ Em Andamento
- [ ] Sistema de compra com saldo automático
- [x] Validação de expiração de transações ✅

### 🐛 Bugs Conhecidos
- [ ] Status de transação PIX não atualiza após pagamento (ALTA)

### ❌ Pendente
- [ ] Backup automático configurado
- [ ] Tratamento de erros robusto
- [ ] Logs estruturados
- [ ] Comandos de publicação de contas

---

## 📊 Métricas de Sucesso

### Funcionalidades Core
- ✅ 100% das funcionalidades básicas implementadas
- ✅ Sistema de pagamento PIX funcionando
- ✅ Webhook automático funcionando

### Próximos Marcos
- 🎯 Compras automáticas com saldo (Semana 1-2)
- 🎯 Expiração automática de transações (Semana 3)
- 🎯 Backup automático (Semana 4)
- 🎯 Publicação automática de contas (Semana 5+)

---

## 💡 Observações Importantes

1. **Testes:** Sempre testar em homologação antes de produção
2. **Monitoramento:** Configurar alertas para erros críticos
3. **Backup:** Nunca confiar apenas em um storage
4. **Documentação:** Manter documentação atualizada
5. **Segurança:** Revisar permissões e validações regularmente

---

## 🔗 Links Úteis

- [Documentação API LZT Market](https://lzt-market.readme.io/reference/information)
- [Documentação Discord.js](https://discord.js.org/)
- [Documentação EfiBank](https://dev.efipay.com.br/)
- [Railway Documentation](https://docs.railway.app/)

---

**Última revisão:** Janeiro 2025  
**Próxima revisão:** Após implementação de compras automáticas

