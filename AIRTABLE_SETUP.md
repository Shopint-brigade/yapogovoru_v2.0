# Airtable Setup Guide

This application uses Airtable as its database. Follow this guide to set up your Airtable base and configure the application.

## Overview

Airtable is a cloud-based spreadsheet-database hybrid that provides:
- **No Database Infrastructure**: No need to manage database servers
- **Visual Interface**: View and edit data directly in Airtable's UI
- **Collaboration**: Share data access with team members
- **Automatic Backups**: Airtable handles backups automatically
- **Quick Setup**: Get started in minutes

## Prerequisites

1. An Airtable account (free tier works)
2. Node.js 20 or higher installed

## Step 1: Create Airtable Base

1. Log in to [Airtable](https://airtable.com)
2. Create a new base (or use an existing one)
3. Create the following tables with these exact field names:

### Table: Users
| Field Name | Field Type | Options |
|------------|------------|---------|
| telegramId | Single line text | Required |
| username | Single line text | Optional |
| access | Single line text | Required (admin, user, or guest) |
| createdAt | Date | Include time |

### Table: Agents
| Field Name | Field Type | Options |
|------------|------------|---------|
| userId | Number | Integer, Required |
| name | Single line text | Required |
| elevenLabsApiKey | Single line text | Required |
| agentId | Single line text | Required |
| voiceId | Single line text | Required |
| createdAt | Date | Include time |

### Table: Batches
| Field Name | Field Type | Options |
|------------|------------|---------|
| userId | Number | Integer, Required |
| agentId | Number | Integer, Required |
| name | Single line text | Required |
| csvContent | Long text | Required |
| status | Single line text | Required |
| createdAt | Date | Include time |

### Table: Calls
| Field Name | Field Type | Options |
|------------|------------|---------|
| batchId | Number | Integer, Optional |
| phoneNumber | Single line text | Required |
| status | Single line text | Required |
| elevenLabsCallId | Single line text | Optional |
| recordingUrl | URL | Optional |
| transcript | Long text | Optional |
| createdAt | Date | Include time |

### Table: Settings
| Field Name | Field Type | Options |
|------------|------------|---------|
| userId | Number | Integer, Required |
| airtableApiKey | Single line text | Optional |
| airtableBaseId | Single line text | Optional |
| airtableTableName | Single line text | Optional |
| n8nWebhookUrl | URL | Optional |
| voximplantAccountId | Single line text | Optional |
| voximplantApiKey | Single line text | Optional |
| updatedAt | Date | Include time |

## Step 2: Get Airtable Credentials

### Get API Key
1. Go to [Airtable Account](https://airtable.com/account)
2. Click "Generate API key" under the API section
3. Copy your API key (keep it secure!)

### Get Base ID
1. Go to [Airtable API Documentation](https://airtable.com/api)
2. Select your base
3. The Base ID is shown in the URL and documentation
   - Example: `appXXXXXXXXXXXXXX`

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_random_secret_here

# Airtable Configuration (required)
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

**Important**:
- Replace `keyXXXXXXXXXXXXXX` with your actual Airtable API key
- Replace `appXXXXXXXXXXXXXX` with your actual Airtable Base ID
- Generate a random string for `SESSION_SECRET` (used for session encryption)

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Start the Application

```bash
npm run dev
```

You should see: `Using Airtable storage` in the console output.

The application will be available at `http://localhost:5000`.

## Features

### ✅ Supported Operations
- User authentication via Telegram
- Agent management (create, list, delete)
- Batch processing (create, list, view)
- Call tracking and monitoring
- Settings management (integrations)

### 📊 Data Management
- All data is stored in Airtable
- Sessions are stored in memory (will be lost on server restart)
- Automatic ID mapping between Airtable string IDs and numeric IDs

## Airtable API Rate Limits

- **Free tier**: 5 requests per second per base
- **Pro tier**: 50 requests per second per base

For high-traffic applications, consider upgrading to Airtable Pro.

## Troubleshooting

### Error: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set"
- Make sure you've created a `.env` file in the project root
- Check that both `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are set
- Verify there are no extra spaces or quotes around the values

### Error: "Table not found"
- Verify that all 5 tables exist in your Airtable base:
  - Users
  - Agents
  - Batches
  - Calls
  - Settings
- Check that table names match exactly (case-sensitive)

### Data not appearing
- Check field names match exactly (case-sensitive)
- Verify field types are correct
- Check Airtable API logs in your Airtable account settings

### Sessions lost on server restart
- This is expected behavior with the in-memory session store
- Users will need to log in again after server restarts
- For production, consider using a persistent session store (Redis, etc.)

### Performance issues
- Monitor your Airtable API rate limits
- Reduce the number of concurrent requests if needed
- Consider caching frequently accessed data

## Security Notes

⚠️ **Important Security Practices:**
- Never commit your `.env` file to version control
- Keep your Airtable API key secure and private
- Use different API keys for development and production
- Rotate your API keys periodically
- Use environment variables in production deployments
- Consider using Airtable's read-only API keys for read-only operations

## Production Deployment

### Railway.app (Recommended)

For Railway.app deployment with persistent sessions:

1. See **RAILWAY_DEPLOYMENT.md** for complete deployment guide
2. Railway automatically handles Redis for persistent sessions
3. Just add your Airtable credentials as environment variables

### Other Hosting Platforms

When deploying to other platforms:

1. Set environment variables in your hosting platform:
   ```bash
   NODE_ENV=production
   AIRTABLE_API_KEY=your_production_key
   AIRTABLE_BASE_ID=your_production_base
   SESSION_SECRET=your_secure_random_secret
   REDIS_URL=your_redis_url  # Optional, for persistent sessions
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## Support

For issues:
- **Airtable API**: Check [Airtable API Documentation](https://airtable.com/api)
- **Application Issues**: Create an issue in the project repository

## Additional Resources

- [Airtable API Documentation](https://airtable.com/api)
- [Airtable Community](https://community.airtable.com/)
- [Airtable Support](https://support.airtable.com/)
