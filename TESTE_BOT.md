# 🧪 Guia de Teste do Bot

## ⚠️ IMPORTANTE ANTES DE TESTAR

1. **Certifique-se de que habilitou o "Message Content Intent"** no Discord Developer Portal
   - Vá em: Bot → Privileged Gateway Intents
   - Ative o toggle "Message Content Intent"
   - Clique em "Save Changes"

2. **Adicione o bot ao seu servidor** (se ainda não fez)
   - Vá em: OAuth2 → URL Generator
   - Selecione: `bot` e `applications.commands`
   - Selecione as permissões necessárias
   - Copie a URL e abra no navegador

## 🚀 Como Testar

### 1. Iniciar o Bot

```bash
npm run dev
```

Você deve ver:
```
[INFO] Bot conectado como LZT Market Hype#3929!
[INFO] Comandos slash registrados!
```

### 2. Testar Comandos no Discord

No servidor onde adicionou o bot, teste:

#### `/contas`
- Deve listar contas de Valorant
- Verifique se aparecem os botões "Comprar", preço e "Mais Informações"
- Teste navegação com "◀️ Anterior" e "Próxima ▶️"

#### `/conta id:190911999`
- Substitua `190911999` por um ID real de conta
- Deve mostrar detalhes completos da conta
- Verifique se aparecem os botões de ação

#### `/admin pedidos-pendentes`
- Apenas para administradores
- Deve listar pedidos pendentes (vazio inicialmente)

## 🐛 Problemas Comuns

### Bot não conecta
- Verifique se o token está correto no `.env`
- Certifique-se de que não há espaços extras no token
- Verifique se o bot está online no Discord

### Bot não responde
- Verifique se habilitou o "Message Content Intent"
- Aguarde alguns minutos após adicionar o bot (comandos podem demorar para sincronizar)
- Verifique se o bot tem permissões no canal

### Erro "Missing Access"
- Verifique se o bot tem permissões no servidor
- Vá em: Configurações do Servidor → Integrações → Bot → Verifique permissões

### Comandos não aparecem
- Aguarde até 1 hora para sincronização global
- Ou reinicie o bot (Ctrl+C e `npm run dev` novamente)

## ✅ Checklist de Teste

- [ ] Bot conecta sem erros
- [ ] Comando `/contas` funciona
- [ ] Lista de contas aparece corretamente
- [ ] Botões de navegação funcionam
- [ ] Botão "Mais Informações" funciona
- [ ] Botão "Comprar" abre o modal
- [ ] Comando `/conta` funciona
- [ ] Embed de detalhes está formatado corretamente

