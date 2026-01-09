# Telegram Authentication Setup Guide

This guide explains how to set up Telegram authentication for your application.

## Overview

The application uses Telegram Login Widget to authenticate users. This provides:
- ✅ Secure authentication via Telegram
- ✅ No password management required
- ✅ Instant verification
- ✅ User profile information from Telegram

## Prerequisites

- A Telegram account
- Access to create bots via @BotFather

## Step 1: Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send the command**: `/newbot`
4. **Choose a name** for your bot:
   ```
   Example: Nart Automates Dashboard
   ```
5. **Choose a username** (must end with 'bot'):
   ```
   Example: nartautomates_bot
   ```
6. **Save the bot token** - BotFather will respond with:
   ```
   Done! Congratulations on your new bot...

   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

   Keep your token secure...
   ```

**Important**: Save this token securely! You'll need it for configuration.

## Step 2: Configure Bot for Login

You need to set the domain where your bot will be used for login:

1. **Send to BotFather**: `/setdomain`
2. **Select your bot**: Click on `@your_bot_username`
3. **Enter your domain**:
   - For Railway: `your-app.up.railway.app`
   - For local development: `localhost`
   - For custom domain: `yourdomain.com`

Example:
```
/setdomain
@nartautomates_bot
nartautomates.up.railway.app
```

## Step 3: Configure Environment Variables

### Local Development

Create or update your `.env` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME=nartautomates_bot
```

**Note**:
- `TELEGRAM_BOT_TOKEN` is used on the server to verify authentication
- `VITE_TELEGRAM_BOT_USERNAME` is your bot username (without @) for the client-side widget

### Railway Production

In your Railway project settings, add these environment variables:

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME=nartautomates_bot
```

## Step 4: Test the Login

### Development Mode

1. **Without bot configured** (demo mode):
   - You'll see a "Demo" login button
   - Warning message: "⚠️ Демо-режим"
   - Authentication is NOT verified (development only!)

2. **With bot configured** (real mode):
   - You'll see the official Telegram Login Widget
   - Blue "Log in with Telegram" button
   - Authentication is fully verified

### Production Mode

1. Visit your deployed application
2. Click the Telegram login button
3. Authorize the app in Telegram
4. You'll be logged in automatically

## How It Works

### Authentication Flow

```
┌─────────┐      ┌──────────┐      ┌────────┐      ┌──────────┐
│ User    │      │ Telegram │      │ Widget │      │ Server   │
│ Browser │      │ App      │      │ Script │      │ API      │
└────┬────┘      └────┬─────┘      └───┬────┘      └────┬─────┘
     │                │                 │                │
     │  1. Click Login Button          │                │
     ├─────────────────────────────────>│                │
     │                │                 │                │
     │  2. Open Telegram for Auth      │                │
     │<────────────────┤                │                │
     │                │                 │                │
     │  3. User Authorizes             │                │
     ├───────────────>│                 │                │
     │                │                 │                │
     │                │  4. Return Auth Data             │
     │                ├────────────────>│                │
     │                │                 │                │
     │                │                 │  5. Send to Server
     │                │                 ├───────────────>│
     │                │                 │                │
     │                │                 │  6. Verify Hash
     │                │                 │      using      │
     │                │                 │    Bot Token   │
     │                │                 │                │
     │                │                 │  7. Create Session
     │                │                 │<───────────────┤
     │                │                 │                │
     │  8. User Logged In              │                │
     │<────────────────────────────────┴────────────────┘
```

### Security

1. **Hash Verification**: The server verifies the authentication data using HMAC-SHA256
   ```javascript
   const isValid = verifyTelegramAuth(input, botToken);
   ```

2. **Timestamp Check**: Authentication data must be recent (default: 1 day)
   ```javascript
   const isFresh = isAuthDataFresh(input.auth_date);
   ```

3. **No Sensitive Data**: The bot token is NEVER exposed to the client

## Troubleshooting

### Error: "Invalid Telegram authentication data"

**Causes**:
- Bot token is incorrect
- Auth data has been tampered with
- Clock skew between client and server

**Solutions**:
1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Check server time is synchronized
3. Try logging in again

### Error: "Authentication data is too old"

**Cause**: The auth timestamp is older than 24 hours

**Solution**: Simply try logging in again

### Login button doesn't appear

**Causes**:
- `VITE_TELEGRAM_BOT_USERNAME` not set
- Bot username is incorrect
- Domain not configured in BotFather

**Solutions**:
1. Check `.env` file has `VITE_TELEGRAM_BOT_USERNAME`
2. Verify bot username (without @)
3. Run `/setdomain` in BotFather again

### Warning: "TELEGRAM_BOT_TOKEN not set"

**Cause**: Running in development without bot token

**Impact**:
- ⚠️ Authentication is NOT verified
- Only safe for local development
- Anyone can log in as any user

**Solution**: Add `TELEGRAM_BOT_TOKEN` to `.env` file

### Domain mismatch error

**Cause**: The domain in BotFather doesn't match your deployment URL

**Solution**:
1. Go to @BotFather
2. Send `/setdomain`
3. Select your bot
4. Enter the correct domain

## Development vs Production

### Development (No Bot Token)

```bash
# .env - Development
# TELEGRAM_BOT_TOKEN not set
# VITE_TELEGRAM_BOT_USERNAME not set
```

**Behavior**:
- Shows demo login button
- No authentication verification
- Warning message displayed
- Fast testing without Telegram setup

### Production (With Bot Token)

```bash
# .env - Production
TELEGRAM_BOT_TOKEN=your_real_token
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

**Behavior**:
- Shows real Telegram widget
- Full authentication verification
- Secure login
- Production-ready

## Best Practices

### Security

1. **Never commit bot token**: Add `.env` to `.gitignore`
2. **Use environment variables**: Don't hardcode tokens
3. **Rotate tokens periodically**: Generate new bot token if compromised
4. **Use HTTPS in production**: Required for Telegram widget
5. **Verify authentication**: Always check hash server-side

### User Experience

1. **Show loading states**: Login process may take a few seconds
2. **Handle errors gracefully**: Show friendly error messages
3. **Test on mobile**: Many users will log in via mobile Telegram
4. **Provide demo mode**: For development and testing

### Deployment

1. **Set domain before deploying**: Configure in BotFather first
2. **Test authentication flow**: Verify login works end-to-end
3. **Monitor failed logins**: Check server logs for auth errors
4. **Update environment variables**: Ensure Railway has correct values

## Additional BotFather Commands

### Update Bot Information

```
/setname - Change bot name
/setdescription - Change bot description
/setabouttext - Change bot about text
/setuserpic - Change bot profile picture
```

### Privacy Settings

```
/setjoingroups - Allow/disallow adding bot to groups
/setprivacy - Change privacy mode
```

## Testing Checklist

Before deploying to production:

- [ ] Bot created in @BotFather
- [ ] Bot token saved securely
- [ ] Domain configured in BotFather
- [ ] `TELEGRAM_BOT_TOKEN` set in environment
- [ ] `VITE_TELEGRAM_BOT_USERNAME` set in environment
- [ ] Login button appears correctly
- [ ] Authentication flow works
- [ ] Session persists after login
- [ ] Logout works correctly
- [ ] Error handling tested

## Support

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Login Widget Docs**: https://core.telegram.org/widgets/login
- **BotFather Commands**: https://core.telegram.org/bots#botfather

## Security Considerations

⚠️ **Important Security Notes**:

1. **Never expose bot token** to client-side code
2. **Always verify hash** on the server
3. **Check timestamp freshness** to prevent replay attacks
4. **Use HTTPS** in production (required by Telegram)
5. **Implement rate limiting** to prevent brute force
6. **Log authentication attempts** for security monitoring

## Example Configuration

### Complete `.env` File

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=super-secret-random-string-here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME=nartautomates_bot

# Airtable Configuration
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Redis Configuration (Railway provides automatically)
REDIS_URL=redis://default:password@host:port
```

### Railway Environment Variables

In Railway dashboard → Your Project → Variables:

```
TELEGRAM_BOT_TOKEN = 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME = nartautomates_bot
AIRTABLE_API_KEY = keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID = appXXXXXXXXXXXXXX
SESSION_SECRET = super-secret-random-string
NODE_ENV = production
```

## Next Steps

After setting up Telegram authentication:

1. Test the login flow thoroughly
2. Configure Airtable database (see AIRTABLE_SETUP.md)
3. Deploy to Railway (see RAILWAY_DEPLOYMENT.md)
4. Set up Redis for persistent sessions
5. Monitor authentication logs

Your application is now secure and ready for users to log in with Telegram! 🎉
