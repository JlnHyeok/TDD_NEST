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

  it('동시 충전 요청 => 요청이 순서대로 들어와야합니다.', async () => {
    // 테스트 데이터
    const userId = 1;
    const requestAmount = 5;
    const chargeAmount = [100, 50, 10, 30, 20];
    const transactionType = 0;

    // 예상 결과
    const expectedPoint = [100, 150, 160, 190, 210];
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

    //  동시에 5개의 포인트 충전 요청 전송.
    const chargeRequests = Array(requestAmount)
      .fill(0)
      .map((_, i) => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: chargeAmount[i] })
          .expect(200);
      });
    const results = await Promise.all(chargeRequests);

    // 포인트 충전 결과 비교.
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoint[i],
        updateMillis: expect.any(Number),
      });
    });

    // History 조회.
    const historyRes = await request(app.getHttpServer()).get(
      `/point/${userId}/histories`,
    );

    // History 결과 비교.
    expect(historyRes.body).toEqual(expectedHistory);
  });

  it('동시 사용 요청 => 요청이 순서대로 들어와야합니다.', async () => {
    // 테스트 데이터
    const userId = 1;
    const requestAmount = 5;
    const initialPoint = 5000;
    const useAmount = [1000, 500, 100, 320, 250];

    // 예상 결과
    const expectedPoint = [4000, 3500, 3400, 3080, 2830];
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

    // 먼저 포인트 충전 요청 전송.
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

    // 포인트 사용 결과 비교.
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoint[i],
        updateMillis: expect.any(Number),
      });
    });

    // History 조회.
    const historyRes = await request(app.getHttpServer()).get(
      `/point/${userId}/histories`,
    );

    // History 결과 비교.
    expect(historyRes.body).toEqual(expectedHistory);
  });
});
