import { z } from "zod";

// Zod schemas for validation
export const insertUserSchema = z.object({
  telegramId: z.string(),
  username: z.string().optional(),
});

export const insertAgentSchema = z.object({
  userId: z.number(),
  name: z.string(),
  elevenLabsApiKey: z.string(),
  agentId: z.string(),
  phoneNumber: z.string().optional(), // Phone number connected with the agent
  telephonyProvider: z.enum(["voximplant"]).default("voximplant"), // IP telephony provider
  voximplantApplicationId: z.string().optional(), // Voximplant Application ID
  voximplantRuleId: z.string().optional(), // Voximplant routing rule ID (роутинг)
  agentVariables: z.string().optional(), // JSON string of agent variables from ElevenLabs
  voximplantCode: z.string().optional(), // Generated Voximplant code
});

export const insertBatchSchema = z.object({
  userId: z.number(),
  agentId: z.number(),
  name: z.string(),
  csvContent: z.string(),
  status: z.string().optional(),
});

export const insertSettingsSchema = z.object({
  userId: z.number(),
  airtableApiKey: z.string().optional(),
  airtableBaseId: z.string().optional(),
  airtableTableName: z.string().optional(),
  n8nWebhookUrl: z.string().optional(),
  voximplantAccountId: z.string().optional(),
  voximplantApiKey: z.string().optional(),
});

// TypeScript types
export type UserRole = "admin" | "user" | "guest" | "subscriber";

export type User = {
  id: number;
  telegramId: string;
  username: string | null;
  access: UserRole;
  usage: number;
  channelBonusReceived: boolean;
  createdAt: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;

export type Agent = {
  id: number;
  userId: number;
  name: string;
  elevenLabsApiKey: string;
  agentId: string;
  phoneNumber?: string | null;
  telephonyProvider: "voximplant";
  voximplantApplicationId?: string | null; // Voximplant Application ID
  voximplantRuleId?: string | null; // Voximplant routing rule ID (роутинг)
  agentVariables?: string | null; // JSON string of agent variables from ElevenLabs
  voximplantCode?: string | null; // Generated Voximplant code
  createdAt: Date;
};

export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Batch = {
  id: number;
  userId: number;
  agentId: number;
  name: string;
  csvContent: string;
  status: string;
  createdAt: Date;
};

export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Call = {
  id: number;
  batchId: number | null;
  phoneNumber: string;
  status: string;
  elevenLabsCallId: string | null;
  recordingUrl: string | null;
  transcript: string | null;
  createdAt: Date;
};

export type Settings = {
  id: number;
  userId: number;
  airtableApiKey: string | null;
  airtableBaseId: string | null;
  airtableTableName: string | null;
  n8nWebhookUrl: string | null;
  voximplantAccountId: string | null;
  voximplantApiKey: string | null;
  updatedAt: Date;
};

export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Role-based limits
export const ROLE_LIMITS = {
  admin: {
    maxAgents: Infinity,
    maxBatchSize: Infinity,
    canDeleteAgents: true,
    canViewAllAgents: true,
  },
  subscriber: {
    maxAgents: Infinity,
    maxBatchSize: 1000,
    canDeleteAgents: false,
    canViewAllAgents: false,
  },
  user: {
    maxAgents: 2,
    maxBatchSize: 100,
    canDeleteAgents: false,
    canViewAllAgents: false,
  },
  guest: {
    maxAgents: 1,
    maxBatchSize: 10,
    canDeleteAgents: false,
    canViewAllAgents: false,
  },
} as const;

export function getRoleLimits(role: UserRole) {
  return ROLE_LIMITS[role];
}
