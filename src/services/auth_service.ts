import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/knex';
import { checkKarmaBlacklist } from './karma_service';

export const registerUser = async (full_name: string, email: string, password: string) => {
  const isBlacklisted = await checkKarmaBlacklist(email);
  if (isBlacklisted) {
    throw new Error('OOPS!! User is blacklisted and cannot be onboarded');
  }

  const existing = await db('users').where({ email }).first();
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);

  return db.transaction(async (trx) => {
    const userId = uuidv4();
    await trx('users').insert({ id: userId, full_name, email, password: hashed });

    const walletId = uuidv4();
    await trx('wallets').insert({ id: walletId, user_id: userId, balance: 0 });

    return { userId, walletId };
  });
};

export const loginUser = async (email: string, password: string) => {
  const user = await db('users').where({ email }).first();
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, full_name: user.full_name, email: user.email } };
};