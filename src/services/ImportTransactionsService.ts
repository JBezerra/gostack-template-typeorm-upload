import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const transactions: TransactionCSV[] = [];
    const categories: string[] = [];

    const parseCSV = readCSVStream.pipe(parseStream);
    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      const transaction = {
        title,
        type,
        value,
        category,
      };
      transactions.push(transaction);
      categories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const transactionsRepository = await getCustomRepository(
      TransactionsRepository,
    );
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
