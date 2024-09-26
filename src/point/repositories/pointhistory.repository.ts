import { PointHistoryTable } from '../../database/pointhistory.table';
import { TransactionType, PointHistory } from '../point.model';
import { IPointHistoryRepository } from './pointhistory.repository.interface';
import { Injectable } from '@nestjs/common';

export const POINT_HISTORY_REPOSITORY = 'POINT_HISTORY_REPOSITORY';

@Injectable()
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
