import { NotImplementedError } from "../utils/errors.js";

/**
 * Placeholder for MongoDB database client connection.
 * As per architecture requirements, the actual MongoDB connection, MongoClient,
 * and database initialization are implemented by the assignment author.
 */
export function getDb(): unknown {
  throw new NotImplementedError(
    "MongoDB getDb() must be implemented with native driver by assignment author. For memory development, use REPO_MODE=memory."
  );
}
