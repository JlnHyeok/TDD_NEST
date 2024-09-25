// 동일한 User ID에 대한 요청이 동시에 발생할 경우, 요청을 순차적으로 처리하고,
// 다른 User ID에 대한 요청은 병렬로 처리할 수 있도록 구현.
export class UserRequestQueue {
  private queues: Map<number, Promise<any>> = new Map();

  async addToQueue<T>(userId: number, task: () => Promise<T>): Promise<T> {
    // 특정 User ID에 대한 요청이 없을 경우, 빈 Promise를 생성.
    const existingRequest = this.queues.get(userId) ?? Promise.resolve();

    // 기존 요청이 처리된 후, 새로운 요청을 실행.
    const newRequest = existingRequest.then(async () => {
      try {
        const result = await task();
        return result;
      } catch (error) {
        throw error;
      }
    });

    this.queues.set(userId, newRequest);

    return newRequest;
  }
}
