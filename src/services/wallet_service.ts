import { randomUUID } from 'crypto';
import db from '../config/knex';

export const fundWallet = async (userId: string, amount: number) => {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  return db.transaction(async (trx) => {
    const wallet = await trx('wallets').where({ user_id: userId }).first();
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = parseFloat(wallet.balance) + amount;
    await trx('wallets').where({ id: wallet.id }).update({ balance: newBalance });

    await trx('transactions').insert({
      id: randomUUID(),
      wallet_id: wallet.id,
      type: 'credit',
      amount,
      description: 'Wallet funding',
      reference: randomUUID(),
    });

    return { balance: newBalance };
  });
};

export const transferFunds = async (senderId: string, recipientEmail: string, amount: number) => {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  return db.transaction(async (trx) => {
    const senderWallet = await trx('wallets').where({ user_id: senderId }).first();
    if (!senderWallet) throw new Error('Sender wallet not found');
    if (parseFloat(senderWallet.balance) < amount) throw new Error('Insufficient funds');

    const recipient = await trx('users').where({ email: recipientEmail }).first();
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.id === senderId) throw new Error('Cannot transfer to yourself');

    const recipientWallet = await trx('wallets').where({ user_id: recipient.id }).first();
    const ref = randomUUID();

    await trx('wallets')
      .where({ id: senderWallet.id })
      .update({ balance: parseFloat(senderWallet.balance) - amount });

    await trx('wallets')
      .where({ id: recipientWallet.id })
      .update({ balance: parseFloat(recipientWallet.balance) + amount });

    await trx('transactions').insert([
      { id: randomUUID(), wallet_id: senderWallet.id, type: 'debit', amount, description: `Transfer to ${recipientEmail}`, reference: ref },
      { id: randomUUID(), wallet_id: recipientWallet.id, type: 'credit', amount, description: `Transfer from sender`, reference: randomUUID() },
    ]);

    return { message: 'Transfer successful' };
  });
};

export const withdrawFunds = async (userId: string, amount: number) => {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  return db.transaction(async (trx) => {
    const wallet = await trx('wallets').where({ user_id: userId }).first();
    if (!wallet) throw new Error('Wallet not found');
    if (parseFloat(wallet.balance) < amount) throw new Error('Insufficient funds');

    const newBalance = parseFloat(wallet.balance) - amount;
    await trx('wallets').where({ id: wallet.id }).update({ balance: newBalance });

    await trx('transactions').insert({
      id: randomUUID(),
      wallet_id: wallet.id,
      type: 'debit',
      amount,
      description: 'Withdrawal',
      reference: randomUUID(),
    });

    return { balance: newBalance };
  });
};

export const getBalance = async (userId: string) => {
  const wallet = await db('wallets').where({ user_id: userId }).first();
  if (!wallet) throw new Error('Wallet not found');
  return { balance: parseFloat(wallet.balance) };
};