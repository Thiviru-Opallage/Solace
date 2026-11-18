import { env } from "../config/env.js";
import { NotImplementedError } from "../utils/errors.js";

/**
 * Transaction runner interface.
 * In memory mode (used for local testing & development), directly executes the callback function.
 * In mongo mode, wraps operations in a MongoDB client session with withTransaction().
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (env.REPO_MODE === "memory") {
    return await fn();
  }

  throw new NotImplementedError(
    "MongoDB withTransaction() must be implemented with native driver session by assignment author."
  );
}
