const request = require('supertest');
const app = require('../src/app');

describe('Setup da aplicação', () => {
  it('GET /health retorna 200 e status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rota inexistente retorna 404 em JSON', async () => {
    const res = await request(app).get('/rota-que-nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('JSON malformado retorna 400', async () => {
    const res = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{invalido');
    expect(res.status).toBe(400);
  });
});
