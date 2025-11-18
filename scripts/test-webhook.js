

const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http:
const TXID = process.argv[2];
const VALOR = process.argv[3] || '10.00';

if (!TXID) {
  console.error('❌ Erro: txid é obrigatório');
  console.log('\nUso:');
  console.log('  node scripts/test-webhook.js <txid> [valor]');
  console.log('\nExemplo:');
  console.log('  node scripts/test-webhook.js pix_827292b4-3d7e-42e8-9387-edcc506aca90 10.00');
  process.exit(1);
}

const payload = {
  evento: 'pix.pagamento',
  horario: new Date().toISOString(),
  txid: TXID,
  valor: {
    original: VALOR.toString()
  },
  endToEndId: `E${Date.now()}00000000000001`,
  pix: [
    {
      endToEndId: `E${Date.now()}00000000000001`,
      txid: TXID,
      valor: VALOR.toString(),
      horario: new Date().toISOString()
    }
  ],
  devolucoes: []
};

console.log('🧪 Testando Webhook PIX');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`URL: ${WEBHOOK_URL}`);
console.log(`Txid: ${TXID}`);
console.log(`Valor: R$ ${VALOR}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📤 Enviando payload...');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');

axios.post(WEBHOOK_URL, payload, {
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('✅ Resposta recebida:');
    console.log(`Status: ${response.status}`);
    console.log('Body:', JSON.stringify(response.data, null, 2));
    
    if (response.data.processed) {
      console.log('\n🎉 Webhook processado com sucesso!');
      console.log('Verifique:');
      console.log('  - Logs do bot');
      console.log('  - Saldo do usuário (/meusaldo)');
      console.log('  - DM recebida');
    } else {
      console.log('\n⚠️ Webhook recebido mas não processado');
      console.log('Motivo:', response.data.message || response.data.error);
    }
  })
  .catch(error => {
    console.error('❌ Erro ao enviar webhook:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Body:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Erro: Não foi possível conectar ao servidor');
      console.error('Verifique se o bot está rodando e WEBHOOK_ENABLED=true');
    } else {
      console.error('Erro:', error.message);
    }
    process.exit(1);
  });

