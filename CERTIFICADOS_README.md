# 📋 Configuração de Certificados EfiBank

## ✅ Certificados Convertidos

Os certificados foram convertidos para base64 e estão prontos para uso no Railway:

- ✅ `certificado-homologacao_base64.txt` - Para ambiente SANDBOX
- ✅ `certificado-producao_base64.txt` - Para ambiente PRODUÇÃO

## 🔧 Configuração no Railway

### Para TESTES (SANDBOX/Homologação):

```
EFI_SANDBOX=true
EFI_CLIENT_ID=Client_Id_89f7c76497d583d6f617b3624d850cc2154d9a45
EFI_CLIENT_SECRET=Client_Secret_6cabf14f5b5a0ce35ea795a5a548ded121315232
EFI_CERTIFICATE_BASE64=<cole_o_conteudo_de_certificado-homologacao_base64.txt>
EFI_PIX_KEY=<sua_chave_pix_aqui>
```

### Para PRODUÇÃO:

```
EFI_SANDBOX=false
EFI_CLIENT_ID=<suas_credenciais_de_producao>
EFI_CLIENT_SECRET=<suas_credenciais_de_producao>
EFI_CERTIFICATE_BASE64=<cole_o_conteudo_de_certificado-producao_base64.txt>
EFI_PIX_KEY=<sua_chave_pix_de_producao>
```

### ⚠️ Variáveis Obrigatórias:

- `EFI_PIX_KEY` - **OBRIGATÓRIA**: Sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
  - Exemplo: `12345678900` (CPF), `contato@exemplo.com` (email), ou chave aleatória da EfiBank
  - Você pode encontrar/criar sua chave PIX no painel da EfiBank: https://app.sejaefi.com.br/

## 📝 Como Copiar o Base64

1. Abra o arquivo `certificado-homologacao_base64.txt` ou `certificado-producao_base64.txt`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no Railway na variável `EFI_CERTIFICATE_BASE64`
5. **IMPORTANTE:** Não adicione espaços ou quebras de linha - cole exatamente como está

## ⚠️ Importante

- **NUNCA** commite os arquivos `.p12` ou `*_base64.txt` no Git
- Use SANDBOX para testes primeiro
- Certifique-se de que `EFI_SANDBOX` corresponde ao certificado usado
- As credenciais (CLIENT_ID e CLIENT_SECRET) devem corresponder ao ambiente

## 🔄 Script de Conversão

Se precisar converter novamente:

```bash
node scripts/convert-cert-to-base64.js certs/certificado-homologacao.p12
node scripts/convert-cert-to-base64.js certs/certificado-producao.p12
```

