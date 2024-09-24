import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('동시 충전 요청', async () => {
    const userId = 1;
    const chargeAmount = [100, 50, 10];
    const expectedPoint = [100, 150, 160];

    // 포인트 충전 요청을 동시에 3개 보냅니다.
    const chargeRequests = Array(3)
      .fill(0)
      .map((_, i) => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: chargeAmount[i] })
          .expect(200);
      });
    const results = await Promise.all(chargeRequests);

    // 결과를 확인합니다.
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoint[i],
        updateMillis: expect.any(Number),
      });
    });
  });

  it('동시 사용 요청', async () => {
    const userId = 1;
    const useAmount = [10, 50, 100];
    const expectedPoint = [150, 100, 0];

    // 포인트 충전을 먼저 합니다.
    await request(app.getHttpServer())
      .patch(`/point/${userId}/charge`)
      .send({ amount: 160 });

    // 포인트 사용 요청을 동시에 3개 보냅니다.
    const useRequests = Array(3)
      .fill(0)
      .map((_, i) => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: useAmount[i] })
          .expect(200);
      });
    const results = await Promise.all(useRequests);

    // 결과를 확인합니다.
    results.forEach((res, i) => {
      expect(res.body).toEqual({
        id: userId,
        point: expectedPoint[i],
        updateMillis: expect.any(Number),
      });
    });
  });
});
