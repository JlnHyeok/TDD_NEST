import { UserPointTable } from '../../database/userpoint.table';
import { IUserPointRepository } from './userpoint.repository.interface';
import { Injectable } from '@nestjs/common';

export const USER_POINT_REPOSITORY = 'USER_POINT_REPOSITORY';

@Injectable()
export class UserPointRepository implements IUserPointRepository {
  constructor(private readonly userDb: UserPointTable) {}

  async selectById(id: number) {
    return await this.userDb.selectById(id);
  }

  async insertOrUpdate(id: number, amount: number) {
    return await this.userDb.insertOrUpdate(id, amount);
  }
}
