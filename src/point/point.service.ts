import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { UserRequestQueue } from 'src/utils/user-request-queue';
import { IPointHistoryRepository } from './repositories/pointhistory.repository.interface';
import { IUserPointRepository } from './repositories/userpoint.repository.interface';
import { USER_POINT_REPOSITORY } from './repositories/userpoint.repository';
import { POINT_HISTORY_REPOSITORY } from './repositories/pointhistory.repository';

@Injectable()
// TODO: 코드 리팩토링 필요
export class PointService {
  constructor(
    @Inject(USER_POINT_REPOSITORY)
    private readonly userDb: IUserPointRepository,

    @Inject(POINT_HISTORY_REPOSITORY)
    private readonly historyDb: IPointHistoryRepository,

    private readonly requestQueue: UserRequestQueue,
  ) {}

  // 특정 유저의 포인트를 조회하는 기능.
  async getPoint(userId: number): Promise<UserPoint> {
    // Validation
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('올바르지 않은 ID 값 입니다.');
    }
    // 포인트 조회 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      const user = await this.userDb.selectById(userId);
      return user;
    } catch (e) {
      throw new InternalServerErrorException(
        '포인트 조회 중 시스템 에러가 발생했습니다.',
      );
    }
  }

  // 특정 유저의 포인트 충전/이용 내역을 조회하는 기능 구현.
  async getHistory(userId: number): Promise<PointHistory[]> {
    // Validation
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('올바르지 않은 ID 값 입니다.');
    }
    // 포인트 내역 조회 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      const history = await this.historyDb.selectAllByUserId(userId);
      return history;
    } catch (e) {
      throw new InternalServerErrorException(
        '포인트 내역 조회 중 시스템 에러가 발생했습니다.',
      );
    }
  }

  // 특정 유저의 포인트를 충전하는 기능 구현.
  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    this.validateUserIdAndAmount(userId, amount);

    return await this.handleTransaction(userId, amount, TransactionType.CHARGE);
  }

  // 특정 유저의 포인트를 사용하는 기능 구현.
  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    this.validateUserIdAndAmount(userId, amount);

    return await this.handleTransaction(userId, amount, TransactionType.USE);
  }

  //#region Private Methods
  // 유저 ID와 충전 및 사용 금액 Validation
  private validateUserIdAndAmount(userId: number, amount: number) {
    const checkUserId = !Number.isInteger(userId) || userId <= 0;
    const checkAmount = !Number.isInteger(amount) || amount <= 0;

    if (checkUserId && checkAmount) {
      throw new BadRequestException(
        'ID 값과 충전 및 사용 금액이 올바르지 않습니다.',
      );
    }

    if (checkUserId) {
      throw new BadRequestException('올바르지 않은 ID 값 입니다.');
    }

    if (checkAmount) {
      throw new BadRequestException('충전 및 사용 금액은 0보다 커야 합니다.');
    }
  }

  // 포인트 Transaction 처리
  private async handleTransaction(
    userId: number,
    amount: number,
    type: TransactionType,
  ): Promise<UserPoint> {
    let originalPoint: number;

    try {
      return await this.requestQueue.addToQueue<UserPoint>(userId, async () => {
        const user = await this.userDb.selectById(userId);
        originalPoint = user.point;

        const updatedUser = await this.updateUserPoint(user, amount, type);
        return updatedUser;
      });
    } catch (e) {
      // 에러 발생 시, 원래 포인트로 롤백
      if (originalPoint) this.userDb.insertOrUpdate(userId, originalPoint);
      // HttpException이 발생한 경우, 해당 에러를 throw
      if (e instanceof HttpException) throw e;
      // 그 외 에러 발생 시, InternalServerErrorException throw
      throw new InternalServerErrorException('시스템 에러가 발생했습니다.');
    }
  }

  // 유저 포인트 업데이트 및 History 추가
  private async updateUserPoint(
    userPoint: UserPoint,
    amount: number,
    type: TransactionType,
  ): Promise<UserPoint> {
    const { id, point } = userPoint;
    const currentMillis = Date.now();
    switch (type) {
      // 충전
      case TransactionType.CHARGE:
        // 충전 금액이 100,000원을 초과할 경우, 에러 처리
        if (amount > 100_000) {
          throw new BadRequestException('포인트 충전 한도는 100,000원 입니다.');
        }

        // 충전 후 포인트가 100,000원을 초과할 경우, 에러 처리
        if (point + amount > 100_000) {
          throw new BadRequestException('포인트 소지 한도는 100,000원 입니다.');
        }
        await this.userDb.insertOrUpdate(id, point + amount);
        await this.historyDb.insert(id, amount, type, currentMillis);
        return { id, point: point + amount, updateMillis: currentMillis };

      // 사용
      case TransactionType.USE:
        // 사용할 포인트가 유저의 포인트보다 클 경우 에러 처리
        if (point < amount) {
          throw new BadRequestException('포인트가 부족합니다.');
        }

        await this.userDb.insertOrUpdate(id, point - amount);
        await this.historyDb.insert(id, amount, type, currentMillis);
        return { id, point: point - amount, updateMillis: currentMillis };

      // 기타
      default:
        throw new BadRequestException('올바르지 않은 Transaction 입니다.');
    }
  }
  //#endregion
}
