import Airtable from "airtable";
import type { IStorage } from "./storage";
import type {
  User, InsertUser,
  Agent, InsertAgent,
  Batch, InsertBatch,
  Call,
  Settings, InsertSettings
} from "@shared/schema";

interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

interface AirtableUser {
  id: string;
  fields: {
    userId?: number; // The user# field from Airtable
    telegramId: string;
    username?: string;
    access?: string;
    usage?: number;
    channelBonusReceived?: boolean;
    createdAt: string;
  };
}

interface AirtableAgent {
  id: string;
  fields: {
    agentNumericId?: number; // The agent# field from Airtable
    userId: number;
    name: string;
    elevenLabsApiKey: string;
    agentId: string;
    phoneNumber?: string;
    telephonyProvider?: string;
    voximplantApplicationId?: string;
    voximplantRuleId?: string;
    agentVariables?: string;
    voximplantCode?: string;
    createdAt: string;
  };
}

interface AirtableBatch {
  id: string;
  fields: {
    batchId?: number;
    userId: number;
    agentId: number;
    name: string;
    csvContent: string;
    status: string;
    createdAt: string;
  };
}

interface AirtableCall {
  id: string;
  fields: {
    batchId?: number;
    phoneNumber: string;
    status: string;
    elevenLabsCallId?: string;
    recordingUrl?: string;
    transcript?: string;
    createdAt: string;
  };
}

interface AirtableSettings {
  id: string;
  fields: {
    userId: number;
    airtableApiKey?: string;
    airtableBaseId?: string;
    airtableTableName?: string;
    n8nWebhookUrl?: string;
    voximplantAccountId?: string;
    voximplantApiKey?: string;
    updatedAt: string;
  };
}

export class AirtableStorage implements IStorage {
  private base: Airtable.Base;
  private userIdMap: Map<number, string> = new Map(); // Maps numeric IDs to Airtable record IDs
  private agentIdMap: Map<number, string> = new Map();
  private batchIdMap: Map<number, string> = new Map();
  private settingsIdMap: Map<number, string> = new Map();
  private nextUserId = 1;
  private nextAgentId = 1;
  private nextBatchId = 1;

  constructor(config: AirtableConfig) {
    Airtable.configure({
      apiKey: config.apiKey,
    });
    this.base = Airtable.base(config.baseId);
    // Initialize ID maps asynchronously, but don't block constructor
    this.initializeIdMaps().catch(err => {
      console.error('Failed to initialize Airtable ID maps:', err);
      console.error('Make sure your Airtable base has the required tables: Users, Agents, Batches, Calls, Settings');
    });
  }

  private async initializeIdMaps(): Promise<void> {
    // Load existing records to build ID mappings
    try {
      console.log('Initializing Airtable ID maps...');

      const userRecords = await this.base('Users').select().all() as unknown as AirtableUser[];
      console.log(`Loaded ${userRecords.length} users from Airtable`);
      userRecords.forEach((record, index) => {
        // Use userId field from Airtable if available, otherwise fallback to sequential ID
        const id = record.fields.userId || (index + 1);
        this.userIdMap.set(id, record.id);
        this.nextUserId = Math.max(this.nextUserId, id + 1);
      });

      const agentRecords = await this.base('Agents').select().all() as unknown as AirtableAgent[];
      console.log(`Loaded ${agentRecords.length} agents from Airtable`);
      agentRecords.forEach((record, index) => {
        // Use agentNumericId field from Airtable if available, otherwise fallback to sequential ID
        const id = record.fields.agentNumericId || (index + 1);
        this.agentIdMap.set(id, record.id);
        this.nextAgentId = Math.max(this.nextAgentId, id + 1);
      });

      const batchRecords = await this.base('Batches').select().all() as unknown as AirtableBatch[];
      console.log(`Loaded ${batchRecords.length} batches from Airtable`);
      batchRecords.forEach((record, index) => {
        // Use batchId field from Airtable if available, otherwise fallback to sequential ID
        const id = record.fields.batchId || (index + 1);
        this.batchIdMap.set(id, record.id);
        this.nextBatchId = Math.max(this.nextBatchId, id + 1);
      });

      console.log('✅ Airtable ID maps initialized successfully');
    } catch (error: any) {
      console.error('❌ Error initializing ID maps:', error.message || error);
      console.error('Please check:');
      console.error('  1. AIRTABLE_API_KEY is correct');
      console.error('  2. AIRTABLE_BASE_ID is correct');
      console.error('  3. Tables exist: Users, Agents, Batches, Calls, Settings');
      console.error('  4. Table names are exact (case-sensitive)');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const recordId = this.userIdMap.get(id);
      if (!recordId) return undefined;

      const record = await this.base('Users').find(recordId) as unknown as AirtableUser;
      return this.convertUserFromAirtable(record, id);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    try {
      const records = await this.base('Users')
        .select({
          filterByFormula: `{telegramId} = "${telegramId}"`,
          maxRecords: 1,
        })
        .all() as unknown as AirtableUser[];

      if (records.length === 0) return undefined;

      // Find the numeric ID for this record
      let numericId = 0;
      for (const [id, recordId] of Array.from(this.userIdMap.entries())) {
        if (recordId === records[0].id) {
          numericId = id;
          break;
        }
      }

      return this.convertUserFromAirtable(records[0], numericId);
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const record = await this.base('Users').create({
      userId: id, // Set the userId field in Airtable
      telegramId: user.telegramId,
      username: user.username,
      access: 'user', // Default access level for new users
      usage: 0, // Default usage limit for new users
      channelBonusReceived: false, // Default to false
      createdAt: new Date().toISOString(),
    }) as unknown as AirtableUser;

    this.userIdMap.set(id, record.id);

    return this.convertUserFromAirtable(record, id);
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const records = await this.base('Users')
        .select({
          sort: [{ field: 'createdAt', direction: 'desc' }],
        })
        .all() as unknown as AirtableUser[];

      return records.map((record, index) => {
        // Use userId from Airtable field if available
        const userId = record.fields.userId || (() => {
          // Fallback: find in map
          let numericId = 0;
          for (const [id, recordId] of Array.from(this.userIdMap.entries())) {
            if (recordId === record.id) {
              numericId = id;
              break;
            }
          }
          return numericId || (index + 1);
        })();
        return this.convertUserFromAirtable(record, userId);
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUserAccess(userId: number, access: "admin" | "user" | "guest"): Promise<User> {
    try {
      const recordId = this.userIdMap.get(userId);
      if (!recordId) {
        throw new Error('User not found');
      }

      const record = await this.base('Users').update(recordId, {
        access: access,
      }) as unknown as AirtableUser;

      return this.convertUserFromAirtable(record, userId);
    } catch (error) {
      console.error('Error updating user access:', error);
      throw error;
    }
  }

  async claimChannelBonus(userId: number): Promise<User> {
    try {
      const recordId = this.userIdMap.get(userId);
      if (!recordId) {
        throw new Error('User not found');
      }

      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Grant 50 calls bonus
      const newUsage = user.usage + 50;

      const record = await this.base('Users').update(recordId, {
        usage: newUsage,
        channelBonusReceived: true,
      }) as unknown as AirtableUser;

      return this.convertUserFromAirtable(record, userId);
    } catch (error) {
      console.error('Error claiming channel bonus:', error);
      throw error;
    }
  }

  // Agent methods
  async getAgents(userId: number): Promise<Agent[]> {
    try {
      const records = await this.base('Agents')
        .select({
          filterByFormula: `{userId} = ${userId}`,
          sort: [{ field: 'createdAt', direction: 'desc' }],
        })
        .all() as unknown as AirtableAgent[];

      return records.map((record, index) => {
        // Use agentNumericId from Airtable field if available
        const agentId = record.fields.agentNumericId || (() => {
          // Fallback: find in map
          let numericId = 0;
          for (const [id, recordId] of Array.from(this.agentIdMap.entries())) {
            if (recordId === record.id) {
              numericId = id;
              break;
            }
          }
          return numericId || (index + 1);
        })();
        return this.convertAgentFromAirtable(record, agentId);
      });
    } catch (error) {
      console.error('Error getting agents:', error);
      return [];
    }
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.nextAgentId++;
    const record = await this.base('Agents').create({
      agentNumericId: id, // Set the agent# field in Airtable
      userId: agent.userId,
      name: agent.name,
      elevenLabsApiKey: agent.elevenLabsApiKey,
      agentId: agent.agentId,
      phoneNumber: agent.phoneNumber || '',
      telephonyProvider: agent.telephonyProvider || 'voximplant',
      voximplantApplicationId: agent.voximplantApplicationId || '',
      voximplantRuleId: agent.voximplantRuleId || '',
      agentVariables: agent.agentVariables || '',
      voximplantCode: agent.voximplantCode || '',
      createdAt: new Date().toISOString(),
    }) as unknown as AirtableAgent;

    this.agentIdMap.set(id, record.id);

    return this.convertAgentFromAirtable(record, id);
  }

  async updateAgent(id: number, userId: number, updates: Partial<InsertAgent>): Promise<Agent> {
    try {
      const recordId = this.agentIdMap.get(id);
      if (!recordId) {
        throw new Error('Agent not found');
      }

      const updateFields: any = {};
      if (updates.name !== undefined) updateFields.name = updates.name;
      if (updates.elevenLabsApiKey !== undefined) updateFields.elevenLabsApiKey = updates.elevenLabsApiKey;
      if (updates.agentId !== undefined) updateFields.agentId = updates.agentId;
      if (updates.phoneNumber !== undefined) updateFields.phoneNumber = updates.phoneNumber;
      if (updates.telephonyProvider !== undefined) updateFields.telephonyProvider = updates.telephonyProvider;
      if (updates.voximplantApplicationId !== undefined) updateFields.voximplantApplicationId = updates.voximplantApplicationId;
      if (updates.voximplantRuleId !== undefined) updateFields.voximplantRuleId = updates.voximplantRuleId;
      if (updates.agentVariables !== undefined) updateFields.agentVariables = updates.agentVariables;
      if (updates.voximplantCode !== undefined) updateFields.voximplantCode = updates.voximplantCode;

      const record = await this.base('Agents').update(recordId, updateFields) as unknown as AirtableAgent;

      return this.convertAgentFromAirtable(record, id);
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(id: number, userId: number): Promise<void> {
    try {
      const recordId = this.agentIdMap.get(id);
      if (recordId) {
        await this.base('Agents').destroy(recordId);
        this.agentIdMap.delete(id);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  // Batch methods
  async getBatches(userId: number): Promise<Batch[]> {
    try {
      const records = await this.base('Batches')
        .select({
          filterByFormula: `{userId} = ${userId}`,
          sort: [{ field: 'createdAt', direction: 'desc' }],
        })
        .all() as unknown as AirtableBatch[];

      return records.map((record, index) => {
        // Use batchId from Airtable field if available
        const batchId = record.fields.batchId || (() => {
          // Fallback: find in map
          let numericId = 0;
          for (const [id, recordId] of Array.from(this.batchIdMap.entries())) {
            if (recordId === record.id) {
              numericId = id;
              break;
            }
          }
          return numericId || (index + 1);
        })();
        return this.convertBatchFromAirtable(record, batchId);
      });
    } catch (error) {
      console.error('Error getting batches:', error);
      return [];
    }
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    try {
      const recordId = this.batchIdMap.get(id);
      if (!recordId) return undefined;

      const record = await this.base('Batches').find(recordId) as unknown as AirtableBatch;
      return this.convertBatchFromAirtable(record, id);
    } catch (error) {
      console.error('Error getting batch:', error);
      return undefined;
    }
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const id = this.nextBatchId++;
    const record = await this.base('Batches').create({
      batchId: id, // Set the batchId field in Airtable
      userId: batch.userId,
      agentId: batch.agentId,
      name: batch.name,
      csvContent: batch.csvContent,
      status: batch.status || 'pending',
      createdAt: new Date().toISOString(),
    }) as unknown as AirtableBatch;

    this.batchIdMap.set(id, record.id);

    return this.convertBatchFromAirtable(record, id);
  }

  async getCallsByBatchId(batchId: number): Promise<Call[]> {
    try {
      const records = await this.base('Calls')
        .select({
          filterByFormula: `{batchId} = ${batchId}`,
        })
        .all() as unknown as AirtableCall[];

      return records.map((record, index) => this.convertCallFromAirtable(record, index + 1));
    } catch (error) {
      console.error('Error getting calls:', error);
      return [];
    }
  }

  async getCalls(userId: number): Promise<Call[]> {
    try {
      // Get all batches for this user first
      const userBatches = await this.getBatches(userId);
      const batchIds = userBatches.map(b => b.id);

      console.log(`[getCalls] User ${userId} has ${batchIds.length} batches:`, batchIds);

      if (batchIds.length === 0) {
        console.log('[getCalls] No batches found for user, returning empty calls array');
        return [];
      }

      // Build filter formula for all user's batches
      const batchFilters = batchIds.map(id => `{batchId} = ${id}`).join(', ');
      const filterFormula = `OR(${batchFilters})`;

      console.log('[getCalls] Filter formula:', filterFormula);

      const records = await this.base('Calls')
        .select({
          filterByFormula: filterFormula,
          sort: [{ field: 'createdAt', direction: 'desc' }],
        })
        .all() as unknown as AirtableCall[];

      console.log(`[getCalls] Found ${records.length} call records in Airtable`);

      return records.map((record, index) => this.convertCallFromAirtable(record, index + 1));
    } catch (error: any) {
      console.error('[getCalls] Error getting calls for user:', userId);
      console.error('[getCalls] Error details:', error.message || error);
      console.error('[getCalls] Full error:', error);
      return [];
    }
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    try {
      const records = await this.base('Settings')
        .select({
          filterByFormula: `{userId} = ${userId}`,
          maxRecords: 1,
        })
        .all() as unknown as AirtableSettings[];

      if (records.length === 0) return undefined;

      let numericId = 0;
      for (const [id, recordId] of Array.from(this.settingsIdMap.entries())) {
        if (recordId === records[0].id) {
          numericId = id;
          break;
        }
      }

      return this.convertSettingsFromAirtable(records[0], numericId || 1);
    } catch (error) {
      console.error('Error getting settings:', error);
      return undefined;
    }
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    try {
      // Query for existing settings by userId
      const records = await this.base('Settings')
        .select({
          filterByFormula: `{userId} = ${insertSettings.userId}`,
          maxRecords: 1,
        })
        .all() as unknown as AirtableSettings[];

      if (records.length > 0) {
        // Update existing record using the Airtable record ID directly
        const existingRecord = records[0];
        const record = await this.base('Settings').update(existingRecord.id, {
          airtableApiKey: insertSettings.airtableApiKey,
          airtableBaseId: insertSettings.airtableBaseId,
          airtableTableName: insertSettings.airtableTableName,
          n8nWebhookUrl: insertSettings.n8nWebhookUrl,
          voximplantAccountId: insertSettings.voximplantAccountId,
          voximplantApiKey: insertSettings.voximplantApiKey,
          updatedAt: new Date().toISOString(),
        }) as unknown as AirtableSettings;

        // Find numeric ID from map or use fallback
        let numericId = 0;
        for (const [id, recordId] of Array.from(this.settingsIdMap.entries())) {
          if (recordId === record.id) {
            numericId = id;
            break;
          }
        }

        return this.convertSettingsFromAirtable(record, numericId || insertSettings.userId);
      } else {
        // Create new record
        const record = await this.base('Settings').create({
          userId: insertSettings.userId,
          airtableApiKey: insertSettings.airtableApiKey,
          airtableBaseId: insertSettings.airtableBaseId,
          airtableTableName: insertSettings.airtableTableName,
          n8nWebhookUrl: insertSettings.n8nWebhookUrl,
          voximplantAccountId: insertSettings.voximplantAccountId,
          voximplantApiKey: insertSettings.voximplantApiKey,
          updatedAt: new Date().toISOString(),
        }) as unknown as AirtableSettings;

        // Use userId as the numeric ID for settings
        this.settingsIdMap.set(insertSettings.userId, record.id);

        return this.convertSettingsFromAirtable(record, insertSettings.userId);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Conversion helpers
  private convertUserFromAirtable(record: AirtableUser, id: number): User {
    const access = record.fields.access as "admin" | "user" | "guest" | undefined;
    return {
      id,
      telegramId: record.fields.telegramId,
      username: record.fields.username || null,
      access: access || 'user', // Default to 'user' if not set
      usage: record.fields.usage || 0, // Default to 0 if not set
      channelBonusReceived: record.fields.channelBonusReceived || false,
      createdAt: new Date(record.fields.createdAt),
    };
  }

  private convertAgentFromAirtable(record: AirtableAgent, id: number): Agent {
    return {
      id,
      userId: record.fields.userId,
      name: record.fields.name,
      elevenLabsApiKey: record.fields.elevenLabsApiKey,
      agentId: record.fields.agentId,
      phoneNumber: record.fields.phoneNumber || null,
      telephonyProvider: (record.fields.telephonyProvider as "voximplant") || "voximplant",
      voximplantApplicationId: record.fields.voximplantApplicationId || null,
      voximplantRuleId: record.fields.voximplantRuleId || null,
      agentVariables: record.fields.agentVariables || null,
      voximplantCode: record.fields.voximplantCode || null,
      createdAt: new Date(record.fields.createdAt),
    };
  }

  private convertBatchFromAirtable(record: AirtableBatch, id: number): Batch {
    return {
      id,
      userId: record.fields.userId,
      agentId: record.fields.agentId,
      name: record.fields.name,
      csvContent: record.fields.csvContent,
      status: record.fields.status,
      createdAt: new Date(record.fields.createdAt),
    };
  }

  private convertCallFromAirtable(record: AirtableCall, id: number): Call {
    return {
      id,
      batchId: record.fields.batchId || null,
      phoneNumber: record.fields.phoneNumber,
      status: record.fields.status,
      elevenLabsCallId: record.fields.elevenLabsCallId || null,
      recordingUrl: record.fields.recordingUrl || null,
      transcript: record.fields.transcript || null,
      createdAt: new Date(record.fields.createdAt),
    };
  }

  private convertSettingsFromAirtable(record: AirtableSettings, id: number): Settings {
    return {
      id,
      userId: record.fields.userId,
      airtableApiKey: record.fields.airtableApiKey || null,
      airtableBaseId: record.fields.airtableBaseId || null,
      airtableTableName: record.fields.airtableTableName || null,
      n8nWebhookUrl: record.fields.n8nWebhookUrl || null,
      voximplantAccountId: record.fields.voximplantAccountId || null,
      voximplantApiKey: record.fields.voximplantApiKey || null,
      updatedAt: new Date(record.fields.updatedAt),
    };
  }
}
