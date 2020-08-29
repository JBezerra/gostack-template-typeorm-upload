import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const findTransactions = await transactionsRepository.findOne({
      where: { id },
    });

    if (!findTransactions) {
      throw new AppError('Transaction does not exists.', 400);
    }

    await transactionsRepository.delete({ id });
  }
}

export default DeleteTransactionService;
