import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import { createClient } from "redis";
import { verifyTelegramAuth, isAuthDataFresh } from "./telegram-auth";
import { getRoleLimits } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const sessionSecret = process.env.SESSION_SECRET || "default_secret_key";

  // Configure session store (Redis for production, Memory for development)
  let sessionStore;

  if (process.env.REDIS_URL) {
    try {
      // Lazy-load RedisStore to avoid esbuild bundling/minification issues
      const connectRedis = require("connect-redis");
      console.log('connect-redis exports:', Object.keys(connectRedis));

      // connect-redis exports as { default: RedisStore }
      const RedisStore = connectRedis.default || connectRedis.RedisStore || connectRedis;
      console.log('RedisStore type:', typeof RedisStore, RedisStore?.name);

      // Use Redis for persistent sessions (Railway, production, etc.)
      console.log('Configuring Redis session store...');
      const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            // Exponential backoff with max 3 seconds
            if (retries > 10) {
              console.error('❌ Redis connection failed after 10 retries, falling back to memory store');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis Client Connected');
      });

      redisClient.on('reconnecting', () => {
        console.log('⚠️  Redis reconnecting...');
      });

      await redisClient.connect();

      sessionStore = new RedisStore({
        client: redisClient,
        prefix: "sess:",
        ttl: 30 * 24 * 60 * 60, // 30 days in seconds
      });

      console.log('✅ Using Redis for session storage');
    } catch (error: any) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.error('⚠️  Falling back to in-memory session storage');
      console.error('');
      console.error('Please check:');
      console.error('  1. REDIS_URL environment variable is set correctly');
      console.error('  2. Redis service is running and accessible');
      console.error('  3. Network connectivity to Redis host');
      console.error('');

      // Fallback to memory store if Redis fails
      const MemoryStore = createMemoryStore(session);
      sessionStore = new MemoryStore({
        checkPeriod: 86400000, // 24 hours - prune expired entries
      });

      console.log('⚠️  Using in-memory session storage (sessions will be lost on restart)');
    }
  } else {
    // Use in-memory store for local development
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours - prune expired entries
    });

    console.log('⚠️  Using in-memory session storage (sessions will be lost on restart)');
  }

  // Trust proxy for Railway deployment (Railway uses proxies)
  app.set('trust proxy', 1);

  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: app.get("env") === "production",
        httpOnly: true,
        sameSite: app.get("env") === "production" ? 'lax' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Authentication Middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Role-based Middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.access !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    req.user = user; // Attach user to request
    next();
  };

  const checkGuestRestrictions = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId!);
    if (user && user.access === 'guest') {
      // Guests have limited access - you can add specific restrictions here
      req.user = user;
      req.isGuest = true;
    } else {
      req.user = user;
      req.isGuest = false;
    }
    next();
  };

  // Auth Routes
  app.post(api.auth.telegram.path, async (req, res) => {
    try {
      const input = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      // Verify Telegram authentication
      if (botToken) {
        // Production: Verify the hash
        const isValid = verifyTelegramAuth(input, botToken);
        const isFresh = isAuthDataFresh(input.auth_date);

        if (!isValid) {
          return res.status(401).json({
            message: "Invalid Telegram authentication data"
          });
        }

        if (!isFresh) {
          return res.status(401).json({
            message: "Authentication data is too old. Please try again."
          });
        }
      } else {
        // Development: Warn but allow (for testing without bot token)
        console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - authentication is NOT verified!');
        console.warn('⚠️  This is only safe for development. Set TELEGRAM_BOT_TOKEN for production.');
      }

      const telegramId = String(input.id);

      let user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        user = await storage.createUser({
          telegramId,
          username: input.username || input.first_name || "Anonymous",
        });
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error: any) {
      console.error('Error during Telegram authentication:', error);
      res.status(500).json({
        message: 'Authentication failed. Please check server logs.',
        error: error.message
      });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json(null);
    }
    const user = await storage.getUser(req.session.userId!);
    res.json(user);
  });

  // Check Telegram channel membership
  app.post(api.auth.checkChannelMembership.path, isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if bonus already claimed
      if (user.channelBonusReceived) {
        return res.json({
          isMember: true,
          canClaim: false, // Already claimed
        });
      }

      // Check channel membership using Telegram Bot API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const channelUsername = '@nartautomates';

      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelUsername}&user_id=${user.telegramId}`
        );
        const data = await response.json();

        // User is a member if status is: creator, administrator, member
        const isMember = data.ok && ['creator', 'administrator', 'member'].includes(data.result?.status);

        res.json({
          isMember,
          canClaim: isMember && !user.channelBonusReceived,
        });
      } catch (error) {
        console.error('Error checking channel membership:', error);
        res.status(500).json({ message: 'Failed to check channel membership' });
      }
    } catch (error: any) {
      console.error('Error in checkChannelMembership:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Claim channel subscription bonus
  app.post(api.auth.claimBonus.path, isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if bonus already claimed
      if (user.channelBonusReceived) {
        return res.status(400).json({ message: 'Бонус уже получен' });
      }

      // Check channel membership first
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const channelUsername = '@nartautomates';

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelUsername}&user_id=${user.telegramId}`
      );
      const data = await response.json();

      const isMember = data.ok && ['creator', 'administrator', 'member'].includes(data.result?.status);

      if (!isMember) {
        return res.status(400).json({ message: 'Вы должны подписаться на канал для получения бонуса' });
      }

      // Grant bonus
      const updatedUser = await storage.claimChannelBonus(req.session.userId!);
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error claiming bonus:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Agents Routes
  app.get(api.agents.list.path, isAuthenticated, async (req, res) => {
    const agents = await storage.getAgents(req.session.userId!);
    res.json(agents);
  });

  app.post(api.agents.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.agents.create.input.parse(req.body);

      // Get user and check agent limit
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const limits = getRoleLimits(user.access);
      const existingAgents = await storage.getAgents(req.session.userId!);

      if (existingAgents.length >= limits.maxAgents) {
        return res.status(403).json({
          message: `Вы достигли максимального лимита агентов (${limits.maxAgents}) для вашей роли. Обратитесь к администратору для увеличения лимита.`,
        });
      }

      const agent = await storage.createAgent({
        ...input,
        userId: req.session.userId!
      });
      res.status(201).json(agent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.put(api.agents.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.agents.update.input.parse(req.body);
      const agent = await storage.updateAgent(
        Number(req.params.id),
        req.session.userId!,
        input
      );
      res.json(agent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.delete(api.agents.delete.path, isAuthenticated, async (req, res) => {
    // Only admins can delete agents
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.access !== 'admin') {
      return res.status(403).json({
        message: 'Только администраторы могут удалять агентов',
      });
    }

    await storage.deleteAgent(Number(req.params.id), req.session.userId!);
    res.status(204).send();
  });

  // Check ElevenLabs connection and fetch agent variables
  app.post(api.agents.checkConnection.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.agents.checkConnection.input.parse(req.body);
      const { elevenLabsApiKey, agentId } = input;

      // Call ElevenLabs API to get agent details
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        return res.status(400).json({
          message: `Failed to connect to ElevenLabs: ${response.statusText}`,
        });
      }

      const agentData = await response.json();

      // Extract variables from the agent configuration
      const variables = agentData.prompt?.variables || agentData.variables || [];
      const formattedVariables = Array.isArray(variables)
        ? variables.map((v: any) => ({
            name: typeof v === 'string' ? v : v.name,
            value: typeof v === 'object' ? v.value : undefined,
          }))
        : [];

      res.json({
        success: true,
        variables: formattedVariables,
        agentName: agentData.name || agentData.agent_name,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      console.error('Error checking ElevenLabs connection:', err);
      res.status(500).json({
        message: 'Failed to check connection: ' + err.message,
      });
    }
  });

  // Generate Voximplant code based on agent configuration
  app.post(api.agents.generateVoximplantCode.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.agents.generateVoximplantCode.input.parse(req.body);
      const { elevenLabsApiKey, agentId, phoneNumber, variables } = input;

      // Remove '+' from phone number for Voximplant
      const cleanPhoneNumber = phoneNumber.replace(/^\+/, '');

      // Build the dynamic variables object from provided variables
      const dynamicVariables: Record<string, string> = {};
      if (variables && variables.length > 0) {
        variables.forEach(v => {
          dynamicVariables[v.name] = v.value || '';
        });
      }

      // Generate the Voximplant code with user's API key and agent ID
      const code = `require(Modules.ElevenLabs);

VoxEngine.addEventListener(AppEvents.Started, async (event) => {
    // === Safely parse customData ===
    let customData = {};
    const rawCustomData = VoxEngine.customData();
    Logger.write("Raw customData received: " + rawCustomData);

    if (rawCustomData && rawCustomData.trim() !== "") {
        try {
            customData = JSON.parse(rawCustomData);
            Logger.write("Successfully parsed customData: " + JSON.stringify(customData));
        } catch (e) {
            Logger.write("Failed to parse customData: " + e.message);
            VoxEngine.terminate();
            return;
        }
    } else {
        Logger.write("customData is empty or missing");
        VoxEngine.terminate();
        return;
    }

    // === Extract variables with fallbacks ===
    const phoneNumberToCall = String(customData.phone || customData.customer_phone || "").trim();
${variables && variables.length > 0 ? variables.map(v => `    const ${v.name} = String(customData.${v.name} || "${v.value || ''}").trim();`).join('\n') : ''}

    if (!phoneNumberToCall) {
        Logger.write("No phone number found in customData – terminating");
        VoxEngine.terminate();
        return;
    }

    Logger.write(\`Extracted: phone=\${phoneNumberToCall}${variables && variables.length > 0 ? ', ' + variables.map(v => `${v.name}=\${${v.name}}`).join(', ') : ''}\`);

    // === Dynamic variables object (must match ElevenLabs required variables exactly) ===
    const dynamicVariables = {
        customer_phone: phoneNumberToCall,
${variables && variables.length > 0 ? variables.map(v => `        ${v.name}: ${v.name},`).join('\n') : ''}
    };

    Logger.write("Dynamic variables to send: " + JSON.stringify(dynamicVariables));

    // === Create ElevenLabs client with initial variables ===
    const conversationalAIClient = await ElevenLabs.createConversationalAIClient({
        xiApiKey: "${elevenLabsApiKey}",
        agentId: "${agentId}",
        initialMessage: {
            variables: dynamicVariables
        }
    });

    // === Make the outbound call ===
    const call = VoxEngine.callPSTN(phoneNumberToCall, "${cleanPhoneNumber}");  // Your caller ID (without +)

    // Auto-hangup after 6 minutes (400 seconds)
    const autoHangupTimer = setTimeout(() => {
        Logger.write("Auto-hangup after 6 minutes");
        call.hangup();
    }, 400000);

    // === When call connects – bridge media and send rich context ===
    call.addEventListener(CallEvents.Connected, () => {
        Logger.write("Call connected – starting media bridge");
        VoxEngine.sendMediaBetween(call, conversationalAIClient);

        conversationalAIClient.contextualUpdate({
            text: \`You are calling a customer. Phone number: \${phoneNumberToCall}. ${variables && variables.length > 0 ? variables.map(v => `${v.name}: \${${v.name}}.`).join(' ') : ''} Conduct the conversation naturally, professionally, and friendly.\`,
            variables: dynamicVariables  // Reinforced here too
        });
    });

    // === Tool response: end_call handling ===
    conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.AgentToolResponse, (event) => {
        Logger.write("Received AgentToolResponse: " + JSON.stringify(event));

        if (event.data?.payload?.agent_tool_response?.tool_name === "end_call") {
            Logger.write("Detected end_call! Terminating call.");
            if (call) {
                call.hangup();
                clearTimeout(autoHangupTimer);
            }
        }
    });

    // === Fallback: WebSocket close handling ===
    conversationalAIClient.addEventListener("WebSocket.Close", () => {
        Logger.write("WebSocket closed by ElevenLabs");
        if (call) {
            call.hangup();
            clearTimeout(autoHangupTimer);
        }
    });

    // === Cleanup function ===
    const cleanup = () => {
        Logger.write("Cleanup started");
        clearTimeout(autoHangupTimer);
        if (conversationalAIClient) {
            try {
                conversationalAIClient.close();
            } catch (e) {
                Logger.write("Error closing client: " + e);
            }
        }
        VoxEngine.terminate();
    };

    call.addEventListener(CallEvents.Disconnected, cleanup);
    call.addEventListener(CallEvents.Failed, cleanup);
});`;

      res.json({ code });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      console.error('Error generating Voximplant code:', err);
      res.status(500).json({
        message: 'Failed to generate code: ' + err.message,
      });
    }
  });

  // Batches Routes
  app.get(api.batches.list.path, isAuthenticated, async (req, res) => {
    const batches = await storage.getBatches(req.session.userId!);
    res.json(batches);
  });

  app.post(api.batches.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.batches.create.input.parse(req.body);

      // Get user and check batch size limit
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const limits = getRoleLimits(user.access);

      // Count records in the batch data
      let recordCount = 0;
      try {
        const parsed = JSON.parse(input.csvContent);
        if (Array.isArray(parsed)) {
          recordCount = parsed.length;
        }
      } catch {
        // Try CSV parsing
        const lines = input.csvContent.trim().split('\n');
        recordCount = Math.max(0, lines.length - 1); // Subtract header row
      }

      if (recordCount > limits.maxBatchSize) {
        return res.status(403).json({
          message: `Превышен лимит записей в пакете. Ваша роль позволяет максимум ${limits.maxBatchSize} записей, а вы пытаетесь создать ${recordCount}. Обратитесь к администратору для увеличения лимита.`,
        });
      }

      const batch = await storage.createBatch({
        ...input,
        userId: req.session.userId!
      });
      res.status(201).json(batch);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.get(api.batches.get.path, isAuthenticated, async (req, res) => {
    const batch = await storage.getBatch(Number(req.params.id));
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const calls = await storage.getCallsByBatchId(batch.id);
    res.json({ ...batch, calls });
  });

  // Calls Routes
  app.get(api.calls.list.path, isAuthenticated, async (req, res) => {
    // Prevent caching of calls data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const calls = await storage.getCalls(req.session.userId!);
    res.json(calls);
  });

  // Settings Routes
  app.get(api.settings.get.path, isAuthenticated, async (req, res) => {
    const settings = await storage.getSettings(req.session.userId!);
    res.json(settings || {});
  });

  app.post(api.settings.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateSettings({
        ...input,
        userId: req.session.userId!
      });
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      console.error('Settings update error:', err);
      res.status(500).json({
        message: err instanceof Error ? err.message : 'Failed to update settings',
      });
    }
  });

  // Admin Routes (for managing users)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch('/api/admin/users/:id/access', isAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { access } = req.body;

      if (!['admin', 'subscriber', 'user', 'guest'].includes(access)) {
        return res.status(400).json({ message: 'Invalid access level' });
      }

      const updatedUser = await storage.updateUserAccess(userId, access);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get agents for a specific user (admin only)
  app.get('/api/admin/users/:id/agents', isAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const agents = await storage.getAgents(userId);
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update agent for any user (admin only)
  app.put('/api/admin/agents/:id', isAdmin, async (req, res) => {
    try {
      const agentId = Number(req.params.id);
      const { userId, ...updates } = req.body;

      const agent = await storage.updateAgent(agentId, userId, updates);
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete agent for any user (admin only)
  app.delete('/api/admin/agents/:id', isAdmin, async (req, res) => {
    try {
      const agentId = Number(req.params.id);
      const { userId } = req.body;

      await storage.deleteAgent(agentId, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Seed Data
  if (app.get("env") === "development") {
    const existingUser = await storage.getUserByTelegramId("demo_user");
    if (!existingUser) {
      const user = await storage.createUser({
        telegramId: "demo_user",
        username: "DemoUser",
      });
      await storage.createAgent({
        userId: user.id,
        name: "Demo Agent (Russian)",
        elevenLabsApiKey: "sk_demo_12345",
        agentId: "agent_demo_id",
        phoneNumber: "+79011321156",
        telephonyProvider: "voximplant",
      });
      console.log("Database seeded with demo user and agent");
    }
  }

  return httpServer;
}
