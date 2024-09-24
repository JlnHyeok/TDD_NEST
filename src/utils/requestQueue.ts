export class RequestQueue {
  private promiseQueue: Promise<any> = Promise.resolve();

  // 요청을 순차적으로 실행
  async addToQueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Promise 체이닝을 통해 다음 요청을 순차적으로 실행
      this.promiseQueue = this.promiseQueue
        .then(async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .catch(reject);
    });
  }
}
