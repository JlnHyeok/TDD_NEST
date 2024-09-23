import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
      throw new BadRequestException('올바르지 않은 ID 값 입니다.');
    }

    try {
      const user = await this.userDb.selectById(userId);
      return user;
    } catch (e) {
      throw new InternalServerErrorException(
        '포인트 조회 중 시스템 에러가 발생했습니다.',
      );
    }
  }

  // TODO: 특정 유저의 포인트 충전/이용 내역을 조회하는 기능 구현.
  async getHistory(userId: number): Promise<PointHistory[]> {
    // Validation
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('올바르지 않은 ID 값 입니다.');
    }

    try {
      const history = await this.historyDb.selectAllByUserId(userId);
      return history;
    } catch (e) {
      throw new InternalServerErrorException(
        '포인트 내역 조회 중 시스템 에러가 발생했습니다.',
      );
    }
  }

  // TODO: 특정 유저의 포인트를 충전하는 기능 구현.
  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    this.validateUserIdAndAmount(userId, amount);

    // 충전 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      // 유저 포인트 조회
      const user = await this.userDb.selectById(userId);

      // 유저 포인트 업데이트 및 충전 내역 History 추가
      const updatedUser = await this.updateUserPoint(
        user,
        amount,
        TransactionType.CHARGE,
      );

      // 충전된 포인트를 포함한 유저 정보 반환
      return updatedUser;
    } catch (e) {
      throw new InternalServerErrorException(
        '포인트 충전 중 시스템 에러가 발생했습니다.',
      );
    }
  }

  // TODO: 특정 유저의 포인트를 사용하는 기능 구현.
  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    // Validation
    this.validateUserIdAndAmount(userId, amount);

    // 사용 중 에러가 발생할 경우, 에러 처리를 위해 try-catch 문 사용
    try {
      // 유저 포인트 조회
      const user = await this.userDb.selectById(userId);

      // 사용할 포인트가 유저의 포인트보다 클 경우 에러 처리
      if (user.point < amount) {
        throw new BadRequestException('포인트가 부족합니다.');
      }

      // 유저 포인트 업데이트 및 사용 내역 History 추가
      const updatedUser = await this.updateUserPoint(
        user,
        amount,
        TransactionType.USE,
      );

      // 사용된 포인트를 포함한 유저 정보 반환
      return updatedUser;
    } catch (e) {
      // HttpException이 발생한 경우, 해당 에러를 throw
      if (e instanceof HttpException) throw e;

      // 그 외의 경우, InternalServerErrorException throw
      throw new InternalServerErrorException(
        '포인트 사용 중 시스템 에러가 발생했습니다.',
      );
    }
  }

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
        await this.userDb.insertOrUpdate(id, point + amount);
        await this.historyDb.insert(id, amount, type, currentMillis);
        return { id, point: point + amount, updateMillis: currentMillis };

      // 사용
      case TransactionType.USE:
        this.userDb.insertOrUpdate(id, point - amount);
        this.historyDb.insert(id, amount, type, currentMillis);
        return { id, point: point - amount, updateMillis: currentMillis };

      // 기타
      default:
        throw new BadRequestException('올바르지 않은 Transaction 입니다.');
    }
  }
}
