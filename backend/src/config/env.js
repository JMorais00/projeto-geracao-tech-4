const path = require('path');
const dotenv = require('dotenv');

// Em testes (Jest define NODE_ENV=test) usa .env.test; caso contrário, .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

module.exports = process.env;
