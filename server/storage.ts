import type {
  User, InsertUser, UserRole,
  Agent, InsertAgent,
  Batch, InsertBatch,
  Call,
  Settings, InsertSettings
} from "@shared/schema";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserAccess(userId: number, access: UserRole): Promise<User>;
  claimChannelBonus(userId: number): Promise<User>;

  // Agents
  getAgents(userId: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, userId: number, updates: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: number, userId: number): Promise<void>;

  // Batches
  getBatches(userId: number): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  getCallsByBatchId(batchId: number): Promise<Call[]>;
  getCalls(userId: number): Promise<Call[]>;

  // Settings
  getSettings(userId: number): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

import { AirtableStorage } from "./airtable-storage";

function createStorage(): IStorage {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;

  if (!airtableApiKey || !airtableBaseId) {
    throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in environment variables');
  }

  console.log('Using Airtable storage');
  return new AirtableStorage({
    apiKey: airtableApiKey,
    baseId: airtableBaseId,
  });
}

export const storage = createStorage();
