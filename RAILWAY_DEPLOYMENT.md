# Railway.app Deployment Guide

This guide explains how to deploy your application to Railway.app with Airtable and Redis.

## Prerequisites

1. A Railway.app account (free tier works)
2. Airtable base set up (see AIRTABLE_SETUP.md)
3. Git repository connected to Railway

## Deployment Steps

### Step 1: Create New Project on Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it as a Node.js project

### Step 2: Add Redis Service

Railway automatically provides persistent sessions with Redis:

1. In your Railway project, click "New"
2. Select "Database" → "Add Redis"
3. Railway will automatically create a `REDIS_URL` environment variable
4. The application will automatically use Redis for sessions when deployed

### Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

```bash
# Required - Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Required - Session Security
SESSION_SECRET=your_random_secret_key_here

# Optional - Node Environment
NODE_ENV=production

# Optional - Port (Railway sets this automatically)
# PORT=5000
```

**Important**:
- `REDIS_URL` is automatically provided by Railway when you add Redis
- Generate a strong random string for `SESSION_SECRET` (use a password generator)
- Never commit your actual API keys to the repository

### Step 4: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Check the deployment logs for any errors
3. You should see:
   - `✅ Using Redis for session storage`
   - `Using Airtable storage`

### Step 5: Access Your Application

1. Railway provides a public URL automatically
2. Click "Settings" → "Generate Domain" to get a public URL
3. Your application will be available at `your-app.railway.app`

## How It Works

### Session Storage

The application automatically detects the environment:

- **On Railway** (with Redis): Uses Redis for persistent sessions
  - Sessions survive server restarts
  - Sessions are shared across multiple instances
  - Users stay logged in even after deployments

- **Local Development** (no Redis): Uses in-memory sessions
  - Sessions lost on server restart
  - Simpler for local testing

### Environment Detection

```javascript
if (process.env.REDIS_URL) {
  // Production: Use Redis
  console.log('✅ Using Redis for session storage');
} else {
  // Development: Use memory
  console.log('⚠️  Using in-memory session storage');
}
```

## Monitoring

### Check Deployment Logs

```bash
# In Railway dashboard
1. Click on your service
2. Go to "Deployments" tab
3. Click on the latest deployment
4. View logs
```

### Verify Redis Connection

Look for these log messages:
```
Configuring Redis session store...
Redis Client Connected
✅ Using Redis for session storage
```

### Verify Airtable Connection

Look for this log message:
```
Using Airtable storage
```

## Troubleshooting

### Redis Connection Issues

**Error**: `Redis Client Error ECONNREFUSED`

**Solution**:
1. Make sure you've added the Redis service in Railway
2. Check that `REDIS_URL` environment variable exists
3. Restart the deployment

### Airtable Connection Issues

**Error**: `AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set`

**Solution**:
1. Add `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` to Railway environment variables
2. Redeploy the application

### Session Issues

**Problem**: Users get logged out frequently

**Solution**:
1. Check that Redis is running (Railway dashboard)
2. Verify `SESSION_SECRET` is set and consistent
3. Check Redis logs for connection issues

### Deployment Fails

**Check**:
1. Build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (20+)

## Scaling

### Railway Plans

- **Starter (Free)**: 500 hours/month, good for testing
- **Developer ($5/month)**: Always-on deployments
- **Team ($20/month)**: Multiple environments

### Redis Plans

- **Hobby (Free)**: 100MB storage, perfect for sessions
- **Pro ($10/month)**: 1GB storage with backups

### Optimizations

1. **Redis Connection Pooling**: Already configured
2. **Session TTL**: Set to 30 days (configurable in routes.ts)
3. **Airtable Rate Limits**: Monitor API usage in Airtable dashboard

## Local Development with Redis

If you want to test Redis locally:

1. Install Redis:
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. Add to your `.env`:
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

3. Run your app:
   ```bash
   npm run dev
   ```

You should see `✅ Using Redis for session storage`

## Production Checklist

Before deploying to production:

- ✅ Redis service added to Railway
- ✅ `AIRTABLE_API_KEY` environment variable set
- ✅ `AIRTABLE_BASE_ID` environment variable set
- ✅ `SESSION_SECRET` set to a strong random value
- ✅ `NODE_ENV=production` set
- ✅ Airtable base created with all required tables
- ✅ Domain configured in Railway
- ✅ Deployment logs checked for errors

## Cost Estimation

### Free Tier (Perfect for starting):
- Railway Starter: $0 (500 hours/month)
- Railway Redis: $0 (100MB)
- Airtable Free: $0 (1,200 records/base)
- **Total**: $0/month

### Production Tier (Always-on):
- Railway Developer: $5/month
- Railway Redis Pro: $10/month (optional)
- Airtable Plus: $10/month (50,000 records)
- **Total**: $15-25/month

## Support

- **Railway Issues**: https://help.railway.app
- **Airtable Issues**: https://support.airtable.com
- **Application Issues**: Check deployment logs in Railway dashboard

## Next Steps

After deployment:
1. Test the application thoroughly
2. Monitor Redis memory usage
3. Set up custom domain (optional)
4. Configure monitoring/alerts
5. Set up automated backups for Airtable

## Rollback

If something goes wrong:

1. Go to Railway dashboard
2. Click "Deployments"
3. Find a previous working deployment
4. Click "Redeploy"

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Redis Documentation](https://redis.io/docs)
- [Airtable API Documentation](https://airtable.com/api)
