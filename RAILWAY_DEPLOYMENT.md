# 🚂 Railway Deployment Guide for CredBuddy

This guide will help you deploy CredBuddy to Railway with automatic environment variable configuration.

## 📋 Prerequisites

1. A Railway account (sign up at https://railway.app)
2. A Google Gemini API key (get from https://aistudio.google.com/apikey)
3. This repository pushed to GitHub

## 🚀 Deployment Steps

### Step 1: Create a New Project in Railway

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `Credbuddy_Flutter` repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically:
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   - Link it to your service

✅ **No manual configuration needed for the database!**

### Step 3: Set Required Environment Variables

Click on your service → **"Variables"** tab, then add:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
NODE_ENV=production
```

**That's it!** Railway automatically sets:
- ✅ `DATABASE_URL` (from PostgreSQL service)
- ✅ `PORT` (Railway assigns this automatically)

### Step 4: Deploy

1. Railway will automatically deploy your app
2. Wait for the build to complete (usually 2-3 minutes)
3. Click on your service → **"Deployment"** to view logs

### Step 5: Run Database Migrations

After first deployment, you need to sync the database schema:

1. Go to your service → **"Settings"** → **"Deploy"**
2. Add a **"Deploy Command"**:
   ```bash
   npm run db:push && npm start
   ```

   OR use the Railway CLI terminal:
   ```bash
   railway run npm run db:push
   ```

### Step 6: Access Your App

1. Click on your service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** to get a public URL
3. Your app will be available at: `https://your-app-name.up.railway.app`

## 🔍 Verify Deployment

Check the health endpoint:
```
https://your-app-name.up.railway.app/api/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-08T...",
  "environment": "production"
}
```

## 📊 Environment Variables Summary

| Variable | Required | Auto-Set by Railway | Description |
|----------|----------|---------------------|-------------|
| `DATABASE_URL` | ✅ Yes | ✅ Yes (when PostgreSQL added) | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ Yes | ❌ No | Google Gemini API key |
| `NODE_ENV` | ✅ Yes | ❌ No | Set to `production` |
| `PORT` | ⚠️ Optional | ✅ Yes | Railway auto-assigns port |
| `WHATSAPP_VERIFY_TOKEN` | ⚠️ Optional | ❌ No | Defaults to "credit-score-v1" |

## 🛠️ Troubleshooting

### Database Connection Error
- Make sure PostgreSQL service is created and linked
- Check that `DATABASE_URL` is set in variables tab
- Run `npm run db:push` to sync schema

### AI Features Not Working
- Verify `GEMINI_API_KEY` is set correctly
- Check service logs for warnings about missing API key

### App Won't Start
- Check deployment logs for errors
- Verify all required environment variables are set
- Make sure build completed successfully

### Build Failures
- Clear build cache: Settings → Reset → Clear Build Cache
- Check that all dependencies are in `package.json`

## 📝 Additional Commands

**View logs:**
```bash
railway logs
```

**Run commands in production:**
```bash
railway run npm run db:push
```

**Connect to database:**
```bash
railway connect postgres
```

## 🎯 What's Configured Automatically

The `railway.json` file in your project root ensures:
- ✅ Correct build command (`npm install && npm run build`)
- ✅ Correct start command (`npm start`)
- ✅ Health check endpoint (`/api/health`)
- ✅ Automatic restarts on failure
- ✅ Optimized deployment settings

## 🔒 Security Notes

- Never commit `.env` files to Git
- Keep your `GEMINI_API_KEY` secret
- Railway encrypts all environment variables
- Use Railway's audit logs to track changes

## 📚 Next Steps

After deployment:
1. Test all API endpoints
2. Create a demo partner via `/api/partners` endpoint
3. Seed test data using `/api/seed` endpoint
4. Monitor logs for any errors
5. Set up custom domain (optional)

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- CredBuddy Issues: https://github.com/Xeno9948/Credbuddy_Flutter/issues
- Railway Discord: https://discord.gg/railway

---

**Happy Deploying! 🚀**
