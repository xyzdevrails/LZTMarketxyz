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
- ⚠️ **Nota:** Comandos `/contas` e `/conta` devem ser restritos apenas para administradores (não implementado ainda)

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

### 1. Bug: Status de Transação PIX Não Atualiza Após Pagamento ✅
**Prioridade:** 🔴 ALTA (BUG CRÍTICO)  
**Status:** ✅ CORRIGIDO (Janeiro 2025)

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

**Correção implementada:**
- ✅ Corrigido `balanceService.confirmPixPayment()` para usar `transaction.transaction_id` ao invés do parâmetro `transactionId`
- ✅ Garantido que o status seja sempre atualizado corretamente após confirmação de pagamento
- ✅ Corrigido também o uso de `transaction.transaction_id` ao adicionar saldo e nos logs
- ✅ Agora funciona corretamente mesmo quando webhook encontra transação por `efi_txid`

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

### 3. Atribuição Automática de Cargo CLIENTE ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Atribuir automaticamente o cargo 'CLIENTE' quando usuário recebe saldo pela primeira vez
- Funcionar tanto para pagamento PIX confirmado quanto para adição manual pelo admin via `/admin liberar-saldo`
- Verificar se usuário já possui o cargo antes de atribuir (evitar reatribuição desnecessária)
- Atribuir apenas uma vez (na primeira vez que recebe saldo)

**Pontos de implementação:**
- Modificar `balanceService.confirmPixPayment()` para atribuir cargo após adicionar saldo
- Modificar comando `/admin liberar-saldo` para atribuir cargo após liberar saldo manualmente
- Criar função utilitária para verificar e atribuir cargo (evitar duplicação de código)
- Usar ID do cargo configurável via variável de ambiente (ex: `DISCORD_CLIENTE_ROLE_ID`)
- Verificar se usuário já possui o cargo antes de tentar atribuir
- Tratar erros de permissão do bot (logar aviso se não tiver permissão para gerenciar cargos)

**Impacto:** Melhora identificação de clientes no servidor e facilita gestão de comunidade.

---

### 4. Comandos de Publicação de Contas ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

#### 4.1. Comando `/generate` ❌
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

#### 4.2. Comando `/fa` ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Publicar conta manualmente com preço customizado (diferente do preço original da LZT Market)
- Permitir definir margem de lucro ao alterar o preço de venda no bot/servidor
- Publicar no canal do Discord especificado
- Exemplo: Conta custa R$ 198,51 na LZT, mas pode ser vendida por R$ 396,96 no bot
- **Restrição:** Apenas administradores podem usar este comando

**Sintaxe do comando:**
```
/fa item_id:"123491293" canal:"1234234" preco:"200"
```

**Parâmetros:**
- `item_id`: ID da conta na LZT Market (item_id da API LZT)
- `canal`: ID do canal do Discord onde publicar a conta
- `preco`: Preço customizado em reais (ex: "200" para R$ 200,00)

**Funcionalidades:**
- Buscar conta na API LZT usando o `item_id`
- Validar que a conta existe e está disponível
- Verificar se conta já foi publicada antes (mesmo `item_id`) - se sim, ocultar publicação anterior
- Criar embed customizado mostrando:
  - Informações da conta (skins, rank, etc.)
  - Preço customizado definido (não o preço original da LZT)
  - Código de identificação único (HYPE_XXXXXX)
  - Botões interativos "Comprar" e "Mais Informações" (mesmos do sistema atual)
- Publicar embed no canal especificado
- Armazenar mapeamento `item_id -> preço_customizado` para controle de duplicatas

**Fluxo de compra quando cliente clica em "Comprar":**
1. Cliente vê conta publicada no canal e clica em "Comprar"
2. Bot verifica saldo da conta LZT do administrador em tempo real
3. Se não tiver saldo suficiente:
   - Mostrar erro amigável ao cliente
   - Sugerir abrir ticket para resolver
   - Não mencionar explicitamente falta de saldo
4. Se tiver saldo suficiente:
   - Bot compra conta na LZT usando saldo do administrador (preço original, ex: R$ 198,51)
   - Entrega credenciais da conta ao cliente via DM
   - Lucro fica com administrador (preço customizado - preço original)

**Implementação sugerida:**
- Criar comando `/fa` em `src/commands/fa.ts` com permissão de administrador
- Usar `LZTService` para buscar conta por `item_id`
- Criar serviço para verificar saldo da conta LZT do administrador
- Usar `createAccountEmbed` (ou criar função similar) para criar embed
- Modificar embed para mostrar preço customizado ao invés do preço original
- Publicar no canal usando `channel.send()` com botões interativos
- Armazenar mapeamento `item_id -> preço_customizado` em storage (JSON ou banco)
- Implementar lógica para ocultar contas duplicadas (mesmo `item_id`)
- Integrar verificação de saldo LZT no fluxo de compra

**Relação com sistema de lucro:**
- O `/fa` permite definir preço manual, independente da % de lucro configurada via `/painelconfiglzt`
- Contas geradas automaticamente usam % de lucro configurável
- Contas publicadas via `/fa` usam preço customizado definido manualmente

**Impacto:** Permite definir margem de lucro personalizada para cada conta vendida no servidor, funcionando como intermediário entre cliente e LZT Market.

---

#### 4.3. Comando `/painelconfiglzt` ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Painel de configuração para gerenciar lucro percentual de contas geradas automaticamente
- Permitir configurar % de lucro customizável (ex: 50%, 100%, 200%)
- Configurar canal onde contas serão publicadas
- Configurar outros parâmetros do sistema LZT
- **Restrição:** Apenas administradores podem usar este comando

**Funcionalidades:**
- Configurar % de lucro para contas geradas automaticamente via `/generate`
- O lucro será aplicado sobre o preço original da conta na LZT
- Exemplo: Se conta custa R$ 100,00 na LZT e lucro configurado é 50%, será vendida por R$ 150,00
- Exemplo: Se conta custa R$ 100,00 na LZT e lucro configurado é 200%, será vendida por R$ 300,00
- Configurar canal do Discord onde contas serão publicadas
- Configurar cargo CLIENTE (se necessário)
- Configurar URLs e outras configurações do sistema

**Implementação sugerida:**
- Criar comando `/painelconfiglzt` em `src/commands/painelconfiglzt.ts` com permissão de administrador
- Criar embed com botões interativos para cada configuração
- Modal para configurar % de lucro
- Modal para configurar canal
- Armazenar configurações em arquivo JSON ou banco de dados
- Aplicar % de lucro configurada ao gerar contas automaticamente

**Impacto:** Permite gerenciar margem de lucro de forma centralizada para todas as contas geradas automaticamente.

---

### 5. Restrição de Comandos para Administradores ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Restringir comandos `/contas` e `/conta` apenas para administradores
- Clientes não devem poder usar esses comandos
- Esses comandos são apenas para consulta administrativa

**Comandos a restringir:**
- `/contas` - Apenas ADM
- `/conta` - Apenas ADM

**Implementação sugerida:**
- Adicionar verificação de permissão de administrador nos comandos
- Usar `PermissionFlagsBits.Administrator` ou verificar roles
- Mostrar mensagem de erro amigável se usuário não for administrador

**Impacto:** Melhora organização e evita que clientes usem comandos administrativos.

---

### 6. Sistema de Backup Automático ❌
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

### 7. Melhorias de Tratamento de Erros ❌
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

### 8. Validação de Saldo Antes de Comprar ❌
**Prioridade:** 🟡 MÉDIA  
**Status:** Não implementado

**Descrição:**
- Verificar saldo antes de criar pedido
- Mostrar saldo atual e necessário no embed
- Botão "Comprar" desabilitado se saldo insuficiente
- Mensagem educativa quando saldo insuficiente

**Impacto:** Melhor UX e menos pedidos inválidos.

---

### 9. Rate Limiting para Comandos ❌
**Prioridade:** 🟢 BAIXA  
**Status:** Não implementado

**Descrição:**
- Limitar comandos por usuário (ex: 10 comandos/minuto)
- Prevenir spam e abuso
- Mensagem educativa quando limite atingido

**Impacto:** Previne abuso mas não é crítico.

---

### 10. Comando `/historico` para Usuários ❌
**Prioridade:** 🟢 BAIXA  
**Status:** Não implementado

**Descrição:**
- Ver histórico de transações próprias
- Ver histórico de compras
- Filtros por data, tipo, status

**Impacto:** Melhor UX mas não essencial.

---

### 11. Sistema de Estatísticas ❌
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
1. ✅ Corrigir bug de atualização de status de transações PIX (CONCLUÍDO)
2. ✅ Validação de expiração de transações (CONCLUÍDO)

### Semana 4: Backup e Monitoramento
1. ⏳ Sistema de backup automático
2. ⏳ Logs estruturados
3. ⏳ Notificações de erro

### Semana 5+: Funcionalidades Adicionais
1. ⏳ Atribuição automática de cargo CLIENTE
2. ⏳ Restrição de comandos `/contas` e `/conta` para ADM
3. ⏳ Comando `/fa` - Publicação manual com preço customizado
4. ⏳ Comando `/painelconfiglzt` - Configuração de lucro percentual
5. ⏳ Comando `/generate` - Publicação automática de contas
6. ⏳ Rate limiting
7. ⏳ Histórico para usuários
8. ⏳ Estatísticas

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

### ❌ Pendente
- [ ] Atribuição automática de cargo CLIENTE
- [ ] Restrição de comandos `/contas` e `/conta` para ADM
- [ ] Comando `/fa` - Publicação manual com preço customizado
- [ ] Comando `/painelconfiglzt` - Configuração de lucro percentual
- [ ] Comando `/generate` - Publicação automática de contas
- [ ] Sistema de verificação de saldo LZT antes de compra
- [ ] Sistema de ocultação de contas duplicadas

### 🐛 Bugs Conhecidos
- [x] Status de transação PIX não atualiza após pagamento (ALTA) ✅ CORRIGIDO

### ❌ Pendente (continuação)
- [ ] Backup automático configurado
- [ ] Tratamento de erros robusto
- [ ] Logs estruturados

---

## 📊 Métricas de Sucesso

### Funcionalidades Core
- ✅ 100% das funcionalidades básicas implementadas
- ✅ Sistema de pagamento PIX funcionando
- ✅ Webhook automático funcionando

### Próximos Marcos
- 🎯 Compras automáticas com saldo (Semana 1-2)
- 🎯 Expiração automática de transações (Semana 3) ✅
- 🎯 Backup automático (Semana 4)
- 🎯 Atribuição automática de cargo CLIENTE (Semana 5+)
- 🎯 Comando `/fa` - Publicação manual com preço customizado (Semana 5+)
- 🎯 Comando `/painelconfiglzt` - Configuração de lucro (Semana 5+)
- 🎯 Comando `/generate` - Publicação automática de contas (Semana 5+)
- 🎯 Restrição de comandos para administradores (Semana 5+)

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

