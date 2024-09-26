import { PointHistoryTable } from 'src/database/pointhistory.table';
import { TransactionType, PointHistory } from '../point.model';
import { IPointHistoryRepository } from './pointhistory.repository.interface';

export class PointHistoryRepository implements IPointHistoryRepository {
  constructor(private readonly pointHistoryDb: PointHistoryTable) {}

  async insert(
    userId: number,
    amount: number,
    transactionType: TransactionType,
    updateMillis: number,
  ): Promise<PointHistory> {
    return await this.pointHistoryDb.insert(
      userId,
      amount,
      transactionType,
      updateMillis,
    );
  }

  async selectAllByUserId(userId: number): Promise<PointHistory[]> {
    return await this.pointHistoryDb.selectAllByUserId(userId);
  }
}
