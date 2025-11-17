const fs = require('fs');
const path = require('path');

/**
 * Script para converter certificados .p12 para base64
 * Uso: node scripts/convert-cert-to-base64.js <caminho-do-certificado>
 */

const certPath = process.argv[2];

if (!certPath) {
  console.error('❌ Erro: Caminho do certificado não fornecido');
  console.log('\n📖 Uso:');
  console.log('   node scripts/convert-cert-to-base64.js <caminho-do-certificado>');
  console.log('\n📝 Exemplos:');
  console.log('   node scripts/convert-cert-to-base64.js certs/certificado-homologacao.p12');
  console.log('   node scripts/convert-cert-to-base64.js certs/certificado-producao.p12');
  process.exit(1);
}

const fullPath = path.resolve(certPath);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${fullPath}`);
  process.exit(1);
}

try {
  const certBuffer = fs.readFileSync(fullPath);
  const base64 = certBuffer.toString('base64');
  
  console.log('\n✅ Certificado convertido para base64 com sucesso!\n');
  console.log('📋 Base64 (copie e cole no Railway como EFI_CERTIFICATE_BASE64):\n');
  console.log(base64);
  console.log('\n');
  
  // Salva em arquivo também
  const outputFile = `${path.basename(fullPath, '.p12')}_base64.txt`;
  fs.writeFileSync(outputFile, base64);
  console.log(`💾 Base64 também foi salvo em: ${outputFile}\n`);
  
} catch (error) {
  console.error('❌ Erro ao converter certificado:', error.message);
  process.exit(1);
}

