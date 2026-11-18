import { ICounterRepository } from "../ICounterRepository.js";
import { CounterEntity } from "../types.js";
import { getCollection } from "./client.js";

export class MongoCounterRepository implements ICounterRepository {
  private async getCol() {
    return getCollection<CounterEntity>("counters");
  }

  async getNextSequence(counterName: string): Promise<number> {
    const col = await this.getCol();
    // Default start sequence is 1000, so first sequence returned is 1001
    const result = await col.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    if (!result || typeof result.seq !== "number" || result.seq === 1) {
      // If sequence was newly created and got 1, initialize to 1001 to match memory sequence generator
      await col.updateOne({ _id: counterName }, { $set: { seq: 1001 } });
      return 1001;
    }

    return result.seq;
  }
}
