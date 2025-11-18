# 📋 Proposta de Reorganização de Comandos

## 🎯 Separação por Hierarquia

### 👥 COMANDOS DE CLIENTE (Qualquer usuário)

| Comando | Descrição | Status |
|---------|-----------|--------|
| `/adicionarsaldo` | Adiciona saldo à conta via PIX | ✅ Existe |
| `/meusaldo` | Ver seu saldo atual | ⏳ Criar |

---

### 🔐 COMANDOS DE ADMIN (Apenas administradores)

#### 📦 **Grupo: Gerenciamento de Compras**

| Comando Atual | Novo Nome | Descrição |
|--------------|-----------|-----------|
| `/admin confirmar-pagamento` | `/admin finalizar-compra` | Finaliza compra e entrega conta Valorant |
| `/admin pedidos-pendentes` | `/admin compras-pendentes` | Lista compras de contas pendentes |

#### 💰 **Grupo: Gerenciamento de Saldo/PIX**

| Comando Atual | Novo Nome | Descrição |
|--------------|-----------|-----------|
| `/admin transacoes-pix` | `/admin historico-pix` | Lista histórico de transações PIX |
| `/admin transacao-pix` | `/admin detalhes-pix` | Ver detalhes de uma transação PIX |
| `/admin confirmar-pagamento-pix` | `/admin liberar-saldo` | Confirma pagamento PIX e libera saldo |

---

## 📊 Estrutura Proposta Final

### Para Clientes:
```
/adicionarsaldo valor:100
/meusaldo
```

### Para Admins:
```
/admin finalizar-compra pedido_id:xxx
/admin compras-pendentes
/admin historico-pix status:Pendentes
/admin detalhes-pix transaction_id:pix_xxx
/admin liberar-saldo transaction_id:pix_xxx
```

---

## ✅ Vantagens desta Organização:

1. **Clareza**: Nomes deixam claro a função
2. **Separação**: Compras vs Saldo bem separados
3. **Consistência**: Padrão de nomenclatura
4. **Hierarquia**: Cliente vs Admin bem definidos

---

## 🎨 Sugestão de Nomes Alternativos (se quiser):

### Opção A (Atual proposta):
- `finalizar-compra`
- `compras-pendentes`
- `historico-pix`
- `detalhes-pix`
- `liberar-saldo`

### Opção B (Mais verbos):
- `entregar-conta`
- `listar-compras`
- `ver-pix`
- `consultar-pix`
- `adicionar-saldo-pix`

### Opção C (Mais técnico):
- `processar-compra`
- `pedidos-aguardando`
- `transacoes-pix`
- `info-pix`
- `confirmar-saldo`

---

## 💡 Recomendação:

**Manter Opção A** - Mais clara e intuitiva!

