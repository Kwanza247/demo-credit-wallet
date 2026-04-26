import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth_service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) throw new Error('All fields are required');
    const result = await AuthService.registerUser(full_name, email, password);
    res.status(201).json({ status: 'success', message: 'Account created', data: result });
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};