import { Request, Response, NextFunction } from 'express';
import * as WalletService from '../services/wallet_service';

export const fund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { amount } = req.body;
    const result = await WalletService.fundWallet(userId, Number(amount));
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const transfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { recipient_email, amount } = req.body;
    const result = await WalletService.transferFunds(userId, recipient_email, Number(amount));
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const withdraw = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { amount } = req.body;
    const result = await WalletService.withdrawFunds(userId, Number(amount));
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

export const balance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await WalletService.getBalance(userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) { next(error); }
};