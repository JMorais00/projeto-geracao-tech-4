// Uso: npm run check:bcrypt
// Confirma que o módulo nativo do bcrypt foi instalado e funciona neste computador.
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('senha-de-teste', 10);
    const ok = await bcrypt.compare('senha-de-teste', hash);
    const wrong = await bcrypt.compare('outra-senha', hash);

    if (!ok || wrong) throw new Error('bcrypt gerou resultados inesperados');
    console.log('bcrypt OK (node ' + process.version + ', ' + process.platform + '/' + process.arch + ')');
    process.exit(0);
  } catch (error) {
    console.error('Falha no bcrypt:', error.message);
    process.exit(1);
  }
})();
