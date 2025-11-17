# 🧪 Checklist de Testes - Sistema EfiBank PIX

## ✅ Status Atual

- ✅ Criação de cobrança PIX funcionando
- ✅ Geração de QR Code funcionando
- ✅ Validação de chave PIX implementada
- ✅ Logs de diagnóstico implementados
- ✅ Tratamento de erros melhorado

## 📋 Testes Recomendados Antes de Produção

### 1. Testes de Criação de Cobrança

#### ✅ Teste 1.1: Criar cobrança com valor mínimo
- [ ] Execute `/adicionarsaldo valor:1`
- [ ] Verifique se o QR Code é gerado
- [ ] Verifique se a transação é salva em `pix_transactions.json`
- [ ] Verifique se o embed mostra as informações corretas

#### ✅ Teste 1.2: Criar cobrança com valor alto
- [ ] Execute `/adicionarsaldo valor:1000`
- [ ] Verifique se funciona normalmente
- [ ] Verifique se não há erros de validação

#### ✅ Teste 1.3: Criar múltiplas cobranças
- [ ] Execute `/adicionarsaldo` 3 vezes com valores diferentes
- [ ] Verifique se cada transação tem um ID único
- [ ] Verifique se todas são salvas corretamente

### 2. Testes de Validação

#### ✅ Teste 2.1: Valor inválido (menor que mínimo)
- [ ] Execute `/adicionarsaldo valor:0.50`
- [ ] Verifique se retorna erro: "Valor mínimo é R$ 1,00"

#### ✅ Teste 2.2: Valor negativo
- [ ] Execute `/adicionarsaldo valor:-10`
- [ ] Verifique se Discord bloqueia (valor mínimo é 1)

### 3. Testes de Armazenamento

#### ✅ Teste 3.1: Verificar arquivo `pix_transactions.json`
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Abra `pix_transactions.json`
- [ ] Verifique se contém:
  - `transaction_id` único
  - `user_id` correto
  - `amount` correto
  - `status: "pending"`
  - `qr_code` presente
  - `pix_key` presente
  - `efi_txid` presente
  - `efi_location_id` presente

#### ✅ Teste 3.2: Verificar persistência
- [ ] Execute `/adicionarsaldo valor:5`
- [ ] Reinicie o bot
- [ ] Verifique se a transação ainda existe em `pix_transactions.json`

### 4. Testes de QR Code

#### ✅ Teste 4.1: QR Code gerado corretamente
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se a imagem do QR Code aparece no embed
- [ ] Verifique se o QR Code não está corrompido

#### ✅ Teste 4.2: QR Code em formato texto (fallback)
- [ ] Simule erro na geração de imagem
- [ ] Verifique se mostra QR Code como texto no embed

### 5. Testes de Erros

#### ✅ Teste 5.1: Erro de certificado
- [ ] Remova temporariamente `EFI_CERTIFICATE_BASE64` do Railway
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se mostra mensagem de erro clara

#### ✅ Teste 5.2: Erro de chave PIX
- [ ] Remova temporariamente `EFI_PIX_KEY` do Railway
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se mostra erro: "Chave PIX não configurada"

#### ✅ Teste 5.3: Erro de credenciais inválidas
- [ ] Use credenciais incorretas temporariamente
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se mostra erro apropriado

### 6. Testes de Logs

#### ✅ Teste 6.1: Verificar logs no Railway
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique logs no Railway
- [ ] Confirme que aparecem:
  - `[EFI] Configuração detectada`
  - `[EFI] Criando cobrança PIX`
  - `[EFI] Gerando QR Code`
  - `[EFI] QR Code gerado com sucesso`

### 7. Testes de Ambiente

#### ✅ Teste 7.1: Aviso de Sandbox
- [ ] Com `EFI_SANDBOX=true`
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se aparece aviso: "AMBIENTE DE TESTES (SANDBOX)"
- [ ] Verifique se a cor do embed é laranja

#### ✅ Teste 7.2: Produção (quando configurar)
- [ ] Com `EFI_SANDBOX=false`
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Verifique se NÃO aparece aviso de sandbox
- [ ] Verifique se a cor do embed é verde

### 8. Testes de Performance

#### ✅ Teste 8.1: Múltiplas requisições simultâneas
- [ ] Execute `/adicionarsaldo` 5 vezes rapidamente
- [ ] Verifique se todas são processadas
- [ ] Verifique se não há erros de rate limit

#### ✅ Teste 8.2: Tempo de resposta
- [ ] Execute `/adicionarsaldo valor:10`
- [ ] Meça o tempo de resposta
- [ ] Deve ser < 5 segundos

## 🔍 Testes Futuros (Após Implementar Webhook)

### 9. Testes de Confirmação de Pagamento

#### ⏳ Teste 9.1: Webhook recebido
- [ ] Simule pagamento PIX
- [ ] Verifique se webhook é recebido
- [ ] Verifique se saldo é adicionado ao usuário
- [ ] Verifique se status da transação muda para "paid"

#### ⏳ Teste 9.2: Webhook duplicado
- [ ] Envie mesmo webhook duas vezes
- [ ] Verifique se não adiciona saldo duas vezes

#### ⏳ Teste 9.3: Webhook inválido
- [ ] Envie webhook com dados inválidos
- [ ] Verifique se erro é tratado corretamente

## 📊 Resumo de Cobertura

- ✅ Criação de cobrança: **Testado**
- ✅ Geração de QR Code: **Testado**
- ✅ Validações: **Parcialmente testado**
- ✅ Armazenamento: **Parcialmente testado**
- ⏳ Confirmação de pagamento: **Aguardando webhook**
- ⏳ Reembolsos: **Aguardando implementação**

## 🚀 Próximos Passos

1. **Completar testes acima** antes de ir para produção
2. **Implementar servidor webhook** para confirmação automática
3. **Testar fluxo completo** de pagamento em produção
4. **Monitorar logs** nas primeiras horas após deploy em produção

## ⚠️ Checklist Pré-Produção

Antes de mudar para produção, certifique-se:

- [ ] Todos os testes acima foram executados
- [ ] Certificado de produção configurado
- [ ] Credenciais de produção configuradas
- [ ] Chave PIX de produção configurada
- [ ] `EFI_SANDBOX=false` configurado
- [ ] Webhook configurado na EfiBank
- [ ] Servidor webhook implementado e funcionando
- [ ] Logs de monitoramento configurados
- [ ] Backup dos arquivos JSON configurado

