import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const findTransactions = await this.find();
    const incomeFiltered = findTransactions.filter(
      (transaction: Transaction) => {
        return transaction.type === 'income';
      },
    );
    const incomeSum = incomeFiltered.reduce(
      (sum: number, transaction: Transaction) => {
        const income = sum + transaction.value;
        return income;
      },
      0,
    );

    const outcomeFiltered = findTransactions.filter(
      (transaction: Transaction) => {
        return transaction.type === 'outcome';
      },
    );
    const outcomeSum = outcomeFiltered.reduce(
      (sum: number, transaction: Transaction) => {
        const outcome = sum + transaction.value;
        return outcome;
      },
      0,
    );

    const total = incomeSum - outcomeSum;
    const balance = {
      income: incomeSum,
      outcome: outcomeSum,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
