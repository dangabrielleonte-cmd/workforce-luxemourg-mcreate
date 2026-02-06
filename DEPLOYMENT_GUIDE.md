# Workforce Luxembourg - Independent Deployment Guide

Complete guide to deploy the app independently using Supabase, DeepSeek, and your own infrastructure.

## Prerequisites

- Node.js 18+ and pnpm
- GitHub account
- Supabase account (free tier works)
- DeepSeek API account with credits
- Vercel account (for frontend) - optional
- Railway account (for backend) - optional

---

## Part 1: Local Setup

### 1.1 Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/workforce-luxembourg.git
cd workforce-luxembourg
pnpm install
```

### 1.2 Create Environment File

Create `.env.local` in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# DeepSeek Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# App Configuration
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
```

### 1.3 Run Locally

```bash
# Terminal 1: Start backend
pnpm dev

# Terminal 2: In another terminal, start frontend (if separate)
cd client
pnpm dev
```

Visit `http://localhost:5173`

---

## Part 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Fill in:
   - Project name: `workforce-luxembourg`
   - Database password: (generate strong password)
   - Region: Europe (closest to Luxembourg)
4. Click **Create new project** and wait 2-3 minutes

### 2.2 Get Connection Credentials

1. Go to **Settings → Database**
2. Under "Connection pooling", copy the **Connection string**
3. Go to **Settings → API**
4. Copy **Project URL** (VITE_SUPABASE_URL)
5. Copy **anon public key** (VITE_SUPABASE_ANON_KEY)
6. Copy **service_role secret key** (SUPABASE_SERVICE_ROLE_KEY)

### 2.3 Migrate Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Create new query and paste:

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Message sources (citations)
CREATE TABLE message_sources (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  section TEXT,
  source_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations table
CREATE TABLE integrations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  site_key TEXT UNIQUE NOT NULL,
  site_name TEXT,
  primary_color TEXT,
  default_language TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  integration_id BIGINT REFERENCES integrations(id) ON DELETE CASCADE,
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

3. Click **Run**

### 2.4 Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** (default)
3. Optionally enable **Google**, **GitHub**
4. Go to **Authentication → URL Configuration**
5. Add your domain to **Authorized redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.com/auth/callback`

---

## Part 3: DeepSeek Setup

### 3.1 Create DeepSeek Account

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up with email
3. Verify email
4. Go to **API Keys**
5. Click **Create new key**
6. Copy the key to your `.env.local`:

```env
DEEPSEEK_API_KEY=sk-...
```

### 3.2 Add Credits

1. Go to **Billing**
2. Click **Add funds**
3. Add at least $5 (recommended $20 for testing)
4. Wait for credits to appear

### 3.3 Test API

Run this to verify:

```bash
curl https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

---

## Part 4: GitHub Setup

### 4.1 Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `workforce-luxembourg`
3. Description: "AI-powered HR and employment law assistant for Luxembourg"
4. Choose **Public** (so others can use it)
5. Click **Create repository**

### 4.2 Push Code

```bash
cd /path/to/workforce-luxembourg

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: Independent version with DeepSeek and Supabase"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/workforce-luxembourg.git
git branch -M main
git push -u origin main
```

### 4.3 Add Secrets to GitHub

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret** and add:

```
DEEPSEEK_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Part 5: Deployment Options

### Option A: Vercel + Railway (Recommended)

#### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Paste GitHub URL: `https://github.com/YOUR_USERNAME/workforce-luxembourg`
4. Click **Import**
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**

Your frontend is now live at `workforce-luxembourg.vercel.app`

#### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Select your repository
5. Add environment variables:
   - `DEEPSEEK_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
6. Click **Deploy**

Your backend is now live at `railway-app-name.up.railway.app`

#### Connect Frontend to Backend

Update `client/src/lib/trpc.ts`:

```typescript
const apiUrl = process.env.VITE_API_URL || 'https://your-railway-app.up.railway.app/api/trpc';
```

### Option B: Docker + Self-Hosted

#### Build Docker Image

```bash
docker build -t workforce-luxembourg .
```

#### Push to Registry

```bash
docker tag workforce-luxembourg YOUR_REGISTRY/workforce-luxembourg
docker push YOUR_REGISTRY/workforce-luxembourg
```

#### Deploy to VPS

```bash
# SSH into your server
ssh user@your-vps.com

# Pull and run
docker pull YOUR_REGISTRY/workforce-luxembourg
docker run -d \
  -e DEEPSEEK_API_KEY=sk-... \
  -e SUPABASE_URL=https://... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -p 3000:3000 \
  YOUR_REGISTRY/workforce-luxembourg
```

---

## Part 6: Custom Domain

### 6.1 Point Domain to Vercel

1. Buy domain from registrar (Namecheap, GoDaddy, etc.)
2. Go to Vercel project settings
3. Add domain
4. Follow DNS instructions from your registrar

### 6.2 SSL Certificate

Vercel and Railway both provide free SSL certificates automatically.

---

## Part 7: Monitoring & Maintenance

### Health Checks

```bash
# Check backend
curl https://your-api.com/health

# Check database
curl https://your-api.com/db-health

# Check DeepSeek
curl https://your-api.com/llm-health
```

### Logs

**Vercel**: Go to project → Deployments → Logs
**Railway**: Go to project → Logs
**Supabase**: Go to project → Logs

### Cost Monitoring

- **Supabase**: Free tier = 500MB DB + 2GB storage
- **DeepSeek**: ~$0.14/1M input tokens, $0.28/1M output tokens
- **Vercel**: Free tier for most projects
- **Railway**: $5/month free credit

---

## Part 8: Troubleshooting

### "DEEPSEEK_API_KEY not set"

Check `.env.local` has the key and restart dev server.

### "Cannot connect to Supabase"

1. Verify `SUPABASE_URL` and keys are correct
2. Check Supabase project is active
3. Verify database connection string

### "Authentication fails"

1. Check `VITE_SUPABASE_ANON_KEY` is correct
2. Verify redirect URL in Supabase settings
3. Clear browser cookies and try again

### "Responses are slow"

1. Check DeepSeek API status
2. Verify retrieval cache is working
3. Consider upgrading DeepSeek plan

---

## Part 9: Production Checklist

Before going live:

- [ ] Environment variables set in production
- [ ] Database backups configured (Supabase auto-backups)
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Monitoring alerts configured
- [ ] Custom domain configured
- [ ] CORS properly configured
- [ ] Secrets not committed to git
- [ ] Tests passing
- [ ] Load testing completed

---

## Support

For issues:
1. Check logs in deployment platform
2. Verify all environment variables
3. Test API endpoints manually
4. Check GitHub Issues
5. Contact support at help.manus.im

---

## Next Steps

1. **Customize branding**: Update colors, logo in frontend
2. **Add more evidence sources**: Extend retrieval layer
3. **Improve agents**: Fine-tune prompts for better answers
4. **Add analytics**: Track usage and improve UX
5. **Scale**: Upgrade Supabase and DeepSeek as needed

Good luck! 🚀
