import request from 'supertest';
import app from '../app';
import db from '../config/knex';
import * as karmaService from '../services/karma_service';

jest.mock('../services/karma_service');
const mockedKarma = karmaService.checkKarmaBlacklist as jest.Mock;

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
  await db.destroy();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    mockedKarma.mockResolvedValue(false);
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  it('should reject blacklisted user', async () => {
    mockedKarma.mockResolvedValue(true);
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'Bad Actor',
      email: 'bad@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('blacklisted');
  });

  it('should reject duplicate email', async () => {
    mockedKarma.mockResolvedValue(false);
    await request(app).post('/api/v1/auth/register').send({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login successfully', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'john@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(400);
  });
});