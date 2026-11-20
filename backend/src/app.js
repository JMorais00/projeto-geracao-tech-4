require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const qs = require('qs');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Mantém option[45]=GG,PP como objeto com a chave 45 (não como array numérico).
app.set('query parser', (query) => qs.parse(query, { parseArrays: false }));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' })); // limite maior para imagens em base64
app.use('/media', express.static(path.resolve(__dirname, '..', 'media')));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
