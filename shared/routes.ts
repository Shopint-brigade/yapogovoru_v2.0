import { z } from 'zod';
import {
  insertAgentSchema,
  insertBatchSchema,
  insertSettingsSchema,
  type User,
  type Agent,
  type Batch,
  type Call,
  type Settings
} from './schema';

// Re-export User type for client use
export type { User };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    telegram: {
      method: 'POST' as const,
      path: '/api/auth/telegram',
      input: z.object({
        id: z.number().or(z.string()),
        first_name: z.string().optional(),
        username: z.string().optional(),
        photo_url: z.string().optional(),
        auth_date: z.number(),
        hash: z.string()
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.validation,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<User>(),
        401: z.null(),
      }
    },
    checkChannelMembership: {
      method: 'POST' as const,
      path: '/api/auth/check-channel',
      responses: {
        200: z.object({
          isMember: z.boolean(),
          canClaim: z.boolean(),
        }),
        401: errorSchemas.validation,
      }
    },
    claimBonus: {
      method: 'POST' as const,
      path: '/api/auth/claim-bonus',
      responses: {
        200: z.custom<User>(),
        400: errorSchemas.validation,
      }
    }
  },
  agents: {
    list: {
      method: 'GET' as const,
      path: '/api/agents',
      responses: {
        200: z.array(z.custom<Agent>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/agents',
      input: insertAgentSchema.omit({ userId: true }),
      responses: {
        201: z.custom<Agent>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/agents/:id',
      input: insertAgentSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<Agent>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/agents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    checkConnection: {
      method: 'POST' as const,
      path: '/api/agents/check-connection',
      input: z.object({
        elevenLabsApiKey: z.string(),
        agentId: z.string(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          variables: z.array(z.object({
            name: z.string(),
            value: z.string().optional(),
          })).optional(),
          agentName: z.string().optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    generateVoximplantCode: {
      method: 'POST' as const,
      path: '/api/agents/generate-voximplant-code',
      input: z.object({
        elevenLabsApiKey: z.string(),
        agentId: z.string(),
        phoneNumber: z.string(),
        variables: z.array(z.object({
          name: z.string(),
          value: z.string().optional(),
        })).optional(),
      }),
      responses: {
        200: z.object({
          code: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  batches: {
    list: {
      method: 'GET' as const,
      path: '/api/batches',
      responses: {
        200: z.array(z.custom<Batch>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/batches',
      input: insertBatchSchema.omit({ userId: true }),
      responses: {
        201: z.custom<Batch>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/batches/:id',
      responses: {
        200: z.custom<Batch & { calls: Call[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  calls: {
    list: {
      method: 'GET' as const,
      path: '/api/calls',
      responses: {
        200: z.array(z.custom<Call>()),
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<Settings>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSettingsSchema.omit({ userId: true }),
      responses: {
        200: z.custom<Settings>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
