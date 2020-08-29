import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      const { total } = balance;
      if (total - value < 0) {
        throw new AppError('Transaction not allowed', 400);
      }
    }

    const categoryRepository = getRepository(Category);
    const findCategory = await categoryRepository.findOne({
      where: { title: category },
    });
    let category_id;
    if (!findCategory) {
      const createCategory = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(createCategory);
      category_id = createCategory.id;
    } else {
      category_id = findCategory.id;
    }

    const transaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
