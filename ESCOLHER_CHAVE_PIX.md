# 🔑 Escolhendo a Melhor Chave PIX para Webhook

## ✅ **RECOMENDAÇÃO: Use Chave PIX do Tipo E-MAIL**

### Por que E-mail é a Melhor Opção:

1. **✅ Menos Restrições**
   - Chaves aleatórias (UUID) podem ter limitações para webhooks
   - Chaves E-mail geralmente funcionam melhor com webhooks

2. **✅ Mais Fácil de Gerenciar**
   - Fácil de lembrar e configurar
   - Não precisa gerar UUIDs

3. **✅ Mais Compatível**
   - E-mail é amplamente suportado
   - Funciona bem em sandbox e produção

---

## 📋 **Como Configurar Chave PIX E-mail:**

### Opção 1: Via Painel da EfiBank (Recomendado)

1. **Acesse o Painel da EfiBank**
   - https://app.efipay.com.br
   - Faça login na sua conta

2. **Vá em "Chaves PIX" ou "Minhas Chaves"**
   - Procure pela seção de chaves PIX

3. **Cadastre uma Chave E-mail**
   - Clique em "Cadastrar Nova Chave"
   - Escolha tipo "E-mail"
   - Digite seu e-mail (ex: `pagamentos@suaempresa.com.br`)
   - Confirme o cadastro

4. **Copie a Chave E-mail**
   - Anote o e-mail cadastrado
   - Use esse e-mail como `EFI_PIX_KEY`

### Opção 2: Via API (Se Preferir)

Você pode criar uma chave via API, mas o painel é mais fácil.

---

## 🔧 **Como Atualizar no Railway:**

### 1. Acesse as Variáveis de Ambiente no Railway

### 2. Atualize `EFI_PIX_KEY`:
```
EFI_PIX_KEY=seu-email@exemplo.com.br
```

**Exemplo:**
```
EFI_PIX_KEY=pagamentos@lztmarket.com.br
```

### 3. Salve e Aguarde o Redeploy

---

## ⚠️ **IMPORTANTE:**

### Verifique o Ambiente:

- **Se estiver em SANDBOX:**
  - Use uma chave E-mail cadastrada na conta **SANDBOX**
  - Verifique se `EFI_SANDBOX=true`

- **Se estiver em PRODUÇÃO:**
  - Use uma chave E-mail cadastrada na conta **PRODUÇÃO**
  - Verifique se `EFI_SANDBOX=false`

---

## 📊 **Comparação de Tipos de Chave:**

| Tipo | Suporte Webhook | Facilidade | Recomendado |
|------|----------------|------------|-------------|
| **E-mail** | ✅ Excelente | ⭐⭐⭐⭐⭐ | ✅ **SIM** |
| **CPF** | ✅ Bom | ⭐⭐⭐⭐ | ✅ Sim |
| **CNPJ** | ✅ Bom | ⭐⭐⭐⭐ | ✅ Sim |
| **Aleatória (UUID)** | ⚠️ Pode ter restrições | ⭐⭐⭐ | ❌ Não recomendado |

---

## 🎯 **Próximos Passos:**

1. ✅ Cadastre uma chave E-mail no painel da EfiBank
2. ✅ Atualize `EFI_PIX_KEY` no Railway com o e-mail
3. ✅ Aguarde o redeploy
4. ✅ Verifique os logs - deve funcionar agora!

---

## 💡 **Dica:**

Use um e-mail profissional para a chave PIX:
- `pagamentos@suaempresa.com.br`
- `pix@suaempresa.com.br`
- `recebimentos@suaempresa.com.br`

**Evite usar e-mail pessoal** se possível, para manter profissionalismo.

---

## ✅ **Resumo:**

- **Melhor opção:** Chave PIX tipo **E-mail**
- **Por quê:** Menos restrições, mais compatível com webhooks
- **Como:** Cadastre no painel EfiBank e atualize `EFI_PIX_KEY`

**Depois de configurar, o webhook deve funcionar!** 🎉

