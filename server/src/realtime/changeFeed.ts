import { EventEmitter } from "node:events";

export interface ChangeEvent<T = unknown> {
  type: string;
  entity: "claim" | "policy" | "payment" | "user";
  entityId: string;
  data: T;
  timestamp: string;
}

export interface ChangeFeed {
  subscribe(
    filter: (event: ChangeEvent) => boolean,
    listener: (event: ChangeEvent) => void
  ): () => void;
  emit(event: ChangeEvent): void;
}

class InMemoryChangeFeed implements ChangeFeed {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  subscribe(
    filter: (event: ChangeEvent) => boolean,
    listener: (event: ChangeEvent) => void
  ): () => void {
    const handler = (event: ChangeEvent) => {
      if (filter(event)) {
        listener(event);
      }
    };

    this.emitter.on("change", handler);
    return () => {
      this.emitter.off("change", handler);
    };
  }

  emit(event: ChangeEvent): void {
    this.emitter.emit("change", event);
  }
}

export const changeFeed: ChangeFeed = new InMemoryChangeFeed();
