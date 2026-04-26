import request from 'supertest';
import app from '../app';
import db from '../config/knex';
import * as karmaService from '../services/karma_service';

jest.mock('../services/karma_service');
const mockedKarma = karmaService.checkKarmaBlacklist as jest.Mock;

let tokenA: string;
let tokenB: string;

beforeAll(async () => {
  await db.migrate.latest();
  mockedKarma.mockResolvedValue(false);

  await request(app).post('/api/v1/auth/register').send({
    full_name: 'User A', email: 'usera@test.com', password: 'pass123'
  });
  await request(app).post('/api/v1/auth/register').send({
    full_name: 'User B', email: 'userb@test.com', password: 'pass123'
  });

  const resA = await request(app).post('/api/v1/auth/login').send({ email: 'usera@test.com', password: 'pass123' });
  const resB = await request(app).post('/api/v1/auth/login').send({ email: 'userb@test.com', password: 'pass123' });

  tokenA = resA.body.data.token;
  tokenB = resB.body.data.token;
});

afterAll(async () => {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
  await db.destroy();
});

describe('Wallet Operations', () => {
  it('should fund wallet', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/fund')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe(5000);
  });

  it('should reject funding with 0 amount', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/fund')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('should transfer funds', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipient_email: 'userb@test.com', amount: 1000 });
    expect(res.status).toBe(200);
  });

  it('should reject transfer with insufficient funds', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipient_email: 'userb@test.com', amount: 999999 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Insufficient');
  });

  it('should withdraw funds', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/withdraw')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 500 });
    expect(res.status).toBe(200);
  });

  it('should get balance', async () => {
    const res = await request(app)
      .get('/api/v1/wallet/balance')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBeDefined();
  });
});