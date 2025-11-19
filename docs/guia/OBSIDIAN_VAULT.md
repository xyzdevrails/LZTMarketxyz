# 🗂️ Estrutura para Obsidian Vault

> **Dica:** Crie estas páginas no seu Obsidian para navegação rápida

---

## 📑 Páginas Principais

### [[GUIA_CONSULTA_RAPIDA]]
**Tags:** #guia #documentacao #referencia  
**Descrição:** Guia completo de consulta rápida - comece aqui!

---

### [[Comandos Cliente]]
**Tags:** #comandos #cliente #usuario  
**Conteúdo:**
- `/adicionarsaldo` - Adicionar saldo via PIX
- `/meusaldo` - Ver saldo atual
- `/contas` - Listar contas disponíveis
- `/conta` - Ver detalhes de uma conta

**Links relacionados:** [[Fluxo de Compra]]

---

### [[Comandos Admin]]
**Tags:** #comandos #admin #gerenciamento  
**Conteúdo:**
- `/admin finalizar-compra` - Entregar conta
- `/admin compras-pendentes` - Ver compras pendentes
- `/admin historico-pix` - Histórico de PIX
- `/admin detalhes-pix` - Detalhes de transação
- `/admin liberar-saldo` - Liberar saldo manualmente

**Links relacionados:** [[Gerenciamento de Saldo]]

---

### [[Webhook EfiBank]]
**Tags:** #webhook #efibank #pix #automatizacao  
**Conteúdo:**
- Como funciona
- Endpoints disponíveis
- Configuração no Railway
- Troubleshooting

**Links relacionados:** [[Railway Setup]] [[Endpoints HTTP]]

---

### [[Railway Setup]]
**Tags:** #railway #deploy #infraestrutura  
**Conteúdo:**
- Variáveis de ambiente
- Como fazer deploy
- Expor porta do webhook
- Ver logs

**Links relacionados:** [[Webhook EfiBank]]

---

### [[Endpoints HTTP]]
**Tags:** #endpoints #api #http  
**Conteúdo:**
- `GET /health` - Health check
- `POST /webhook/pix` - Webhook PIX
- `POST /webhook/test` - Teste manual

**Links relacionados:** [[Webhook EfiBank]] [[Teste Postman]]

---

### [[Fluxo de Compra]]
**Tags:** #fluxo #compra #processo  
**Conteúdo:**
1. Cliente adiciona saldo
2. Cliente escolhe conta
3. Cliente clica "Comprar"
4. Bot verifica saldo → debita → compra
5. Bot envia credenciais via DM

**Links relacionados:** [[Comandos Cliente]] [[Comandos Admin]]

---

### [[Troubleshooting]]
**Tags:** #troubleshooting #problemas #solucao  
**Conteúdo:**
- Bot não responde
- Webhook não conecta
- Comandos não aparecem
- Transações não confirmam

**Links relacionados:** [[Webhook EfiBank]] [[Railway Setup]]

---

### [[Arquivos JSON]]
**Tags:** #storage #dados #arquivos  
**Conteúdo:**
- `orders.json` - Pedidos
- `user_balances.json` - Saldos
- `pix_transactions.json` - Transações PIX
- Onde ficam (Railway)
- Como acessar

**Links relacionados:** [[Railway Setup]] [[Comandos Admin]]

---

## 🔖 Tags Úteis

Use estas tags para organizar:

- `#comandos` - Todos os comandos
- `#admin` - Coisas de administrador
- `#cliente` - Coisas para clientes
- `#webhook` - Tudo sobre webhooks
- `#railway` - Deploy e infraestrutura
- `#troubleshooting` - Solução de problemas
- `#pix` - Sistema de pagamento PIX
- `#lzt` - Integração com LZT Market

---

## 🔗 Mapa Mental Rápido

```
Bot Discord
├── Comandos Cliente
│   ├── Adicionar Saldo
│   ├── Ver Saldo
│   └── Ver/Comprar Contas
│
├── Comandos Admin
│   ├── Gerenciar Compras
│   └── Gerenciar Saldo/PIX
│
├── Webhook EfiBank
│   ├── Recebe Pagamentos
│   └── Adiciona Saldo Automaticamente
│
└── Railway
    ├── Deploy Automático
    ├── Variáveis de Ambiente
    └── Logs e Monitoramento
```

---

## 📝 Template de Nota Rápida

Quando precisar anotar algo novo:

```markdown
# Título da Nota

**Tags:** #tag1 #tag2  
**Data:** YYYY-MM-DD  
**Contexto:** O que estava fazendo

## O que é?
Descrição breve

## Como usar?
Passos práticos

## Links relacionados
[[Outra Nota]]

## Notas adicionais
Qualquer coisa importante
```

---

## 💡 Dicas para Obsidian

1. **Use `[[links]]`** para conectar páginas relacionadas
2. **Use tags** para agrupar por tema
3. **Crie um MOC (Map of Content)** com links para todas as páginas principais
4. **Use busca** (`Ctrl+O`) para encontrar rapidamente
5. **Crie aliases** para comandos (ex: `adicionarsaldo` → `/adicionarsaldo`)

---

**Criado em:** Novembro 2025  
**Para:** Consulta rápida e troubleshooting

