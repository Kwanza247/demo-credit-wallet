import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);
  return res.status(400).json({ status: 'error', message: err.message });
};