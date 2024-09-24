import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { PointHistory, UserPoint } from './point.model';
import { RequestQueue } from 'src/utils/requestQueue';

describe('PointService', () => {
  let service: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    jest.clearAllMocks();

    // TODO (완): Mocking 처리를 하는 부분으로, 실제 DB에 접근하지 않도록 처리 필요.
    // Mocking 처리를 하기 위해 useValue 부분에 jest.fn()을 사용하여 Mocking 처리를 함.
    // 기존 코드에서는 Mocking 처리를 하지 않았기 때문에, 실제 DB에 접근하는 코드가 테스트에 포함되어 있다.
    // 테스트를 위한 UserPointTable, PointHistoryTable 인스턴스 생성
    // userPointTable = new UserPointTable();
    // pointHistoryTable = new PointHistoryTable();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        RequestQueue,
        {
          provide: UserPointTable,
          useValue:
            // userPointTable,
            {
              selectById: jest.fn(),
              insertOrUpdate: jest.fn(),
            },
        },
        {
          provide: PointHistoryTable,
          useValue:
            // pointHistoryTable,
            {
              insert: jest.fn(),
              selectAllByUserId: jest.fn(),
            },
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);

    // 전체 테스트에 기본적으로 사용할 Mocking 함수를 정의 (DB 조회)
    jest.spyOn(userPointTable, 'selectById').mockResolvedValue({
      id: 1,
      point: 150,
      updateMillis: Date.now(),
    });
  });

  describe('포인트 조회 테스트', () => {
    it('포인트 조회 성공 테스트: ID가 0보다 큰 숫자가 들어올 때 => 정상', async () => {
      service.getPoint(1).then((userPoint: UserPoint) => {
        expect(userPoint).toEqual({
          id: 1,
          point: 150,
          updateMillis: expect.any(Number),
        });
      });
    });

    it('포인트 조회 실패 테스트: ID가 0 이하의 숫자 들어올 때 => 에러 발생', async () => {
      expect(service.getPoint(0)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.getPoint(-1)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });

    it('포인트 조회 실패 테스트: ID가 숫자가 아닌 값이 들어올 때 => 에러 발생', async () => {
      expect(service.getPoint(NaN)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.getPoint(Infinity)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });
  });

  // INITIAL POINT: 150
  describe('포인트 충전 테스트', () => {
    it('포인트 충전 성공 테스트: ID가 0보다 크고, 충전 금액이 0 보다 클 때 => 정상', async () => {
      // 충전 금액이 100원일 때, 포인트 250원으로 증가
      await service.chargePoint(1, 100).then((userPoint: UserPoint) => {
        expect(userPoint).toEqual({
          id: 1,
          point: 250,
          updateMillis: expect.any(Number),
        });
      });

      // userPointTable.selectById 함수가 인자 1을 받아 호출되었는지 확인
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);

      // userPointTable.insertOrUpdate 함수가 인자 1, 250을 받아 호출되었는지 확인
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 250);

      // pointHistoryTable.insert 함수가 인자 1, 100, 0, Number를 받아 호출되었는지 확인
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(
        1,
        100,
        0,
        expect.any(Number),
      );
    });
    it('포인트 충전 실패 테스트: ID가 0보다 크고, 충전 금액이 0 이하 일 때 => 에러 발생', async () => {
      expect(service.chargePoint(1, 0)).rejects.toThrow(
        Error('충전 및 사용 금액은 0보다 커야 합니다.'),
      );
      expect(service.chargePoint(1, -1)).rejects.toThrow(
        Error('충전 및 사용 금액은 0보다 커야 합니다.'),
      );
    });
    it('포인트 충전 실패 테스트: ID가 0 이하이고, 충전 금액이 0 보다 클 때 => 에러 발생', async () => {
      expect(service.chargePoint(0, 100)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.chargePoint(-1, 100)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });
    it('포인트 충전 실패 테스트: ID가 0 이하이고, 충전 금액이 0 이하 일 때 => 에러 발생', async () => {
      expect(service.chargePoint(0, 0)).rejects.toThrow(
        Error('ID 값과 충전 및 사용 금액이 올바르지 않습니다.'),
      );
      expect(service.chargePoint(-1, 0)).rejects.toThrow(
        Error('ID 값과 충전 및 사용 금액이 올바르지 않습니다.'),
      );
    });
    it('포인트 충전 실패 테스트: 충전 금액이 100,000원 초과일 때 => 에러 발생', async () => {
      expect(service.chargePoint(1, 200_000)).rejects.toThrow(
        Error('포인트 충전 한도는 100,000원 입니다.'),
      );
    });
    it('포인트 충전 실패 테스트: 충전 후 금액이 100,000원 초과일 때 => 에러 발생', async () => {
      expect(service.chargePoint(1, 99_999)).rejects.toThrow(
        Error('포인트 소지 한도는 100,000원 입니다.'),
      );
    });
  });

  // INITIAL POINT: 150
  describe('포인트 사용 테스트', () => {
    it('포인트 사용 성공 테스트: ID가 0보다 크고, 사용 금액이 0 보다 클 때 => 정상', async () => {
      // 사용 금액이 100원일 때, 포인트 50원으로 감소
      await service.usePoint(1, 100).then((userPoint: UserPoint) => {
        expect(userPoint).toEqual({
          id: 1,
          point: 50,
          updateMillis: expect.any(Number),
        });
      });

      // userPointTable.selectById 함수가 인자 1을 받아 호출되었는지 확인
      expect(userPointTable.selectById).toHaveBeenCalledWith(1);

      // userPointTable.insertOrUpdate 함수가 인자 1, 50을 받아 호출되었는지 확인
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 50);

      // pointHistoryTable.insert 함수가 인자 1, 100, 1, Number를 받아 호출되었는지 확인
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(
        1,
        100,
        1,
        expect.any(Number),
      );
    });
    it('포인트 사용 실패 테스트: ID가 0보다 크고, 사용 금액이 0 이하 일 때 => 에러 발생', async () => {
      expect(service.usePoint(1, 0)).rejects.toThrow(
        Error('충전 및 사용 금액은 0보다 커야 합니다.'),
      );
      expect(service.usePoint(1, -1)).rejects.toThrow(
        Error('충전 및 사용 금액은 0보다 커야 합니다.'),
      );
    });
    it('포인트 사용 실패 테스트: ID가 0 이하이고, 사용 금액이 0 보다 클 때 => 에러 발생', async () => {
      expect(service.usePoint(0, 100)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.usePoint(-1, 100)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });
    it('포인트 사용 실패 테스트: ID가 0 이하이고, 사용 금액이 0 이하 일 때 => 에러 발생', async () => {
      expect(service.usePoint(0, 0)).rejects.toThrow(
        Error('ID 값과 충전 및 사용 금액이 올바르지 않습니다.'),
      );
      expect(service.usePoint(-1, 0)).rejects.toThrow(
        Error('ID 값과 충전 및 사용 금액이 올바르지 않습니다.'),
      );
    });
    it('포인트 사용 실패 테스트: 포인트가 부족할 때 => 에러 발생', async () => {
      expect(service.usePoint(1, 200)).rejects.toThrow(
        Error('포인트가 부족합니다.'),
      );
    });
  });

  describe('포인트 충전 및 사용 내역 조회 테스트', () => {
    it('포인트 내역 조회 성공 테스트: ID가 0보다 큰 숫자가 들어올 때 => 정상', async () => {
      jest.spyOn(pointHistoryTable, 'selectAllByUserId').mockResolvedValue([
        {
          id: 1,
          userId: 1,
          amount: 100,
          type: 0,
          timeMillis: Date.now(),
        },
      ]);

      await service.getHistory(1).then((histories: PointHistory[]) => {
        expect(histories).toEqual([
          {
            id: 1,
            userId: 1,
            amount: 100,
            type: 0,
            timeMillis: expect.any(Number),
          },
        ]);
      });
    });

    it('포인트 내역 조회 실패 테스트: ID가 0 이하의 숫자 들어올 때 => 에러 발생', async () => {
      expect(service.getHistory(0)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.getHistory(-1)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });

    it('포인트 내역 조회 실패 테스트: ID가 숫자가 아닌 값이 들어올 때 => 에러 발생', async () => {
      expect(service.getHistory(NaN)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
      expect(service.getHistory(Infinity)).rejects.toThrow(
        Error('올바르지 않은 ID 값 입니다.'),
      );
    });
  });
});
