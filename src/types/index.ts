export interface User {
  id: string;
  full_name: string;
  email: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  created_at?: Date;
}
import {Request} from 'express';
export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}