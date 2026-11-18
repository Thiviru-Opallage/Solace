export interface ICounterRepository {
  getNextSequence(counterName: string): Promise<number>;
}
