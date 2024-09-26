import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('동시 충전 요청 => 요청이 순서대로 들어와야하며 충전 후 Point 조회 시, 예상 금액이랑 같아야 하고 History 내역 또한 일치해야 함.', async () => {
    // 테스트 데이터
    const userId = 1;
    // 충전 요청 금액 (총 20개)
    const chargeAmount = [
      100, 50, 10, 30, 20, 40, 50, 60, 70, 80, 90, 110, 120, 120, 150, 180, 50,
      20, 40, 70,
    ];
    const requestAmount = chargeAmount.length;
    const transactionType = 0;

    // 예상 결과 (포인트 충전 결과 내역)
    const expectedPoints = [
      100, 150, 160, 190, 210, 250, 300, 360, 430, 510, 600, 710, 830, 950,
      1100, 1280, 1330, 1350, 1390, 1460,
    ];

    // 예상 포인트 총합
    const expectedPoint = expectedPoints[expectedPoints.length - 1];

    // 예상 History 내역
    const expectedHistory = chargeAmount.map(
      (chargeAmount: number, id: number) => {
        return {
          userId,
          id: id + 1,
          amount: chargeAmount,
          type: transactionType,
          timeMillis: expect.any(Number),
        };
      },
    );

    //  동시에 20개의 포인트 충전 요청 전송.
    const chargeRequests = Array(requestAmount)
      .fill(0)
      .map((_, i) => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: chargeAmount[i] })
          .expect(200);
      });

    const results = await Promise.all(chargeRequests);

    // 포인트 충전 결과 비교 (순서대로 들어왔는지)
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoints[i],
        updateMillis: expect.any(Number),
      });
    });

    // 포인트 조회.
    const getPointRes = await request(app.getHttpServer()).get(
      `/point/${userId}`,
    );

    // 조회 결과 비교. (총 충전된 포인트)
    expect(getPointRes.body.point).toBe(expectedPoint);

    // History 조회.
    const historyRes = await request(app.getHttpServer()).get(
      `/point/${userId}/histories`,
    );

    // History 결과 비교.
    expect(historyRes.body).toEqual(expectedHistory);
  });

  it('동시 사용 요청 => 요청이 순서대로 들어와야하며 사용 후 Point 조회 시, 예상 금액이랑 같아야 하고, History 내역 또한 일치해야 함.', async () => {
    // 테스트 데이터
    const userId = 1;
    const requestAmount = 5;
    const initialPoint = 5000;
    const useAmount = [1000, 500, 100, 320, 250];

    // 예상 결과
    const expectedPoints = [4000, 3500, 3400, 3080, 2830];

    // 예상 잔여 포인트
    const expectedPoint = expectedPoints[expectedPoints.length - 1];

    // 예상 History 내역
    const expectedHistory = useAmount.reduce(
      (acc, currentPoint, i) => {
        acc.push({
          userId,
          id: i + 2,
          amount: currentPoint,
          type: 1,
          timeMillis: expect.any(Number),
        });
        return acc;
      },
      [
        {
          userId,
          id: 1,
          amount: 5000,
          type: 0,
          timeMillis: expect.any(Number),
        },
      ],
    );

    // 먼저 포인트 충전 요청 전송. (사용을 위한 초기 포인트)
    await request(app.getHttpServer())
      .patch(`/point/${userId}/charge`)
      .send({ amount: initialPoint });

    // 동시에 5개의 포인트 사용 요청 전송.
    const useRequests = Array(requestAmount)
      .fill(0)
      .map((_, i) => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: useAmount[i] })
          .expect(200);
      });
    const results = await Promise.all(useRequests);

    // 포인트 사용 결과 비교. (순서대로 들어왔는지)
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoints[i],
        updateMillis: expect.any(Number),
      });
    });

    // 포인트 조회.
    const getPointRes = await request(app.getHttpServer()).get(
      `/point/${userId}`,
    );

    // 조회 결과 비교. (잔여 포인트)
    expect(getPointRes.body.point).toBe(expectedPoint);

    // History 조회.
    const historyRes = await request(app.getHttpServer()).get(
      `/point/${userId}/histories`,
    );

    // History 결과 비교.
    expect(historyRes.body).toEqual(expectedHistory);
  });
});
