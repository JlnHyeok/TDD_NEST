import { UserPointTable } from 'src/database/userpoint.table';
import { IUserPointRepository } from './userpoint.repository.interface';

export class UserPointRepository implements IUserPointRepository {
  constructor(private readonly userDb: UserPointTable) {}

  async selectById(id: number) {
    return await this.userDb.selectById(id);
  }

  async insertOrUpdate(id: number, amount: number) {
    return await this.userDb.insertOrUpdate(id, amount);
  }
}
