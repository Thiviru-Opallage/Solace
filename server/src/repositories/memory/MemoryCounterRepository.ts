import { ICounterRepository } from "../ICounterRepository.js";

export class MemoryCounterRepository implements ICounterRepository {
  private counters = new Map<string, number>();

  async getNextSequence(counterName: string): Promise<number> {
    const current = this.counters.get(counterName) || 1000;
    const next = current + 1;
    this.counters.set(counterName, next);
    return next;
  }

  clear(): void {
    this.counters.clear();
  }
}
