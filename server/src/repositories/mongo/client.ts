import { MongoClient, Db, Collection, Document, ObjectId, Filter } from "mongodb";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";


let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    logger.info(`Connected to MongoDB at ${env.MONGODB_URI}`);
  }
  return client;
}

export async function getDb(): Promise<Db> {
  if (!db) {
    const cli = await getMongoClient();
    db = cli.db();
  }
  return db;
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const database = await getDb();
  return database.collection<T>(name);
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

/**
 * Converts a string or ObjectId to a valid BSON ObjectId.
 * If given a valid 24-hex string, converts to ObjectId.
 * If given an existing ObjectId, returns as-is.
 * If null/undefined or invalid, returns a new ObjectId or null if optional.
 */
export function toObjectId(id?: string | ObjectId): ObjectId {
  if (!id) return new ObjectId();
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return new ObjectId();
}

/**
 * Builds an _id filter matching either native ObjectId or legacy string representation.
 */
export function idFilter(id: string | ObjectId): Filter<Document> {
  if (id instanceof ObjectId) {
    return { _id: id } as unknown as Filter<Document>;
  }
  if (typeof id === "string" && ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
    return { _id: new ObjectId(id) } as unknown as Filter<Document>;
  }
  return { _id: id } as unknown as Filter<Document>;
}


/**
 * Normalizes a document retrieved from MongoDB so that its _id is exposed as a string to the application.
 */
export function normalizeDoc<T extends { _id: string }>(doc: any): T | null {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id?.toString() || doc._id,
  } as T;
}

/**
 * Normalizes an array of documents retrieved from MongoDB.
 */
export function normalizeDocs<T extends { _id: string }>(docs: any[]): T[] {
  return docs.map((doc) => normalizeDoc<T>(doc)!);
}

