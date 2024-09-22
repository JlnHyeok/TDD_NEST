import { Injectable } from '@nestjs/common';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

@Injectable()
// TODO: PointService 클래스 구현.
export class PointService {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  // TODO: 특정 유저의 포인트를 조회하는 기능 구현.
  async getPoint(userId: number): Promise<UserPoint> {
    // selectById 내부에서 Validation 처리를 하고 있기 때문에 별도의 Validation 처리는 구현하지 않음.
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('올바르지 않은 ID 값 입니다.');
    }

    const user = await this.userDb.selectById(userId);
    return user;
  }

  // TODO: 특정 유저의 포인트 충전/이용 내역을 조회하는 기능 구현.
  async getHistory(userId: number): Promise<PointHistory[]> {
    // Validation
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('올바르지 않은 ID 값 입니다.');
    }

    const history = await this.historyDb.selectAllByUserId(userId);
    return history;
  }

  // TODO: 특정 유저의 포인트를 충전하는 기능 구현.
  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    let checkUserId = !Number.isInteger(userId) || userId <= 0;
    let checkAmount = !Number.isInteger(amount) || amount <= 0;

    // userId와 amount가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkUserId && checkAmount) {
      throw new Error('ID 값과 충전 금액이 올바르지 않습니다.');
    }

    // userId가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkUserId) {
      throw new Error('올바르지 않은 ID 값 입니다.');
    }

    // amount가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkAmount) {
      throw new Error('충전 금액은 0보다 커야 합니다.');
    }

    // 충전 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      // 유저의 포인트를 조회하고, 충전된 포인트를 추가
      const user = await this.userDb.selectById(userId);
      await this.userDb.insertOrUpdate(userId, user.point + amount);

      // 충전 내역 History 추가
      await this.historyDb.insert(
        userId,
        amount,
        TransactionType.CHARGE,
        Date.now(),
      );

      // 충전된 포인트를 포함한 유저 정보 반환
      return {
        id: userId,
        point: user.point + amount,
        updateMillis: Date.now(),
      };
    } catch (e) {
      throw new Error('충전 중 에러가 발생했습니다.');
    }
  }

  // TODO: 특정 유저의 포인트를 사용하는 기능 구현.
  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    let checkUserId = !Number.isInteger(userId) || userId <= 0;
    let checkAmount = !Number.isInteger(amount) || amount <= 0;

    // userId와 amount가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkUserId && checkAmount) {
      throw new Error('ID 값과 사용 금액이 올바르지 않습니다.');
    }

    // userId가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkUserId) {
      throw new Error('올바르지 않은 ID 값 입니다.');
    }

    // amount가 숫자가 아니거나 0 이하일 경우 에러 처리
    if (checkAmount) {
      throw new Error('사용 금액은 0보다 커야 합니다.');
    }

    // 사용 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      // 유저의 포인트를 조회하고, 사용된 포인트를 차감
      const user = await this.userDb.selectById(userId);
      await this.userDb.insertOrUpdate(userId, user.point - amount);

      // 사용 내역 History 추가
      await this.historyDb.insert(
        userId,
        amount,
        TransactionType.USE,
        Date.now(),
      );

      // 사용된 포인트를 포함한 유저 정보 반환
      return {
        id: userId,
        point: user.point - amount,
        updateMillis: Date.now(),
      };
    } catch (e) {
      throw new Error('사용 중 에러가 발생했습니다.');
    }
  }
}
