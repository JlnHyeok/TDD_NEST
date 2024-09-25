import { UserRequestQueue } from './user-request-queue'; // 작성한 클래스 경로

describe('UserRequestQueue', () => {
  let requestQueue: UserRequestQueue;

  beforeEach(() => {
    requestQueue = new UserRequestQueue();
  });

  it('다른 유저에 대한 요청 시, 병렬로 작동해야함.', async () => {
    const startTime = Date.now();

    const task1 = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve('User 1 Task Complete'), 200),
      );
    const task2 = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve('User 2 Task Complete'), 100),
      );

    const user1Request = requestQueue.addToQueue(1, task1);
    const user2Request = requestQueue.addToQueue(2, task2);

    await Promise.all([user1Request, user2Request]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 결과 출력
    console.log('duration will be less than 300, duration : ', duration);

    // 병렬로 작동했는지 확인 (최대 작업 시간인 3초보다 작으면 병렬)
    expect(duration).toBeLessThan(300);
  });

  it('동일한 유저에 대한 요청 시, 순차적으로 작동해야함.', async () => {
    const startTime = Date.now();

    const task1 = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve('User 1 Task 1 Complete'), 200),
      );
    const task2 = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve('User 1 Task 2 Complete'), 100),
      );

    const user1Request1 = requestQueue.addToQueue(1, task1);
    const user1Request2 = requestQueue.addToQueue(1, task2);

    await Promise.all([user1Request1, user1Request2]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 결과 출력
    console.log('duration will be greater than 300, duration : ', duration);

    // 순차적으로 작동했는지 확인 (최소 작업 시간인 3초보다 크면 순차)
    expect(duration).toBeGreaterThan(300);
  });
});
