# Migration Guide: Manus → Independent Version

Complete guide to migrate from Manus-hosted version to fully independent deployment.

---

## Overview

| Aspect | Manus Version | Independent Version |
|--------|---------------|-------------------|
| **Auth** | Manus OAuth | Supabase Auth |
| **LLM** | Manus API | DeepSeek API |
| **Database** | MySQL (Manus) | PostgreSQL (Supabase) |
| **Hosting** | Manus Platform | Your choice (Vercel + Railway) |
| **Cost** | Enterprise pricing | $60-140/mo |
| **Control** | Limited | Full |
| **Customization** | Limited | Unlimited |

---

## Step 1: Backup Manus Data

### Export Conversations
```bash
# Export all conversations as JSON
curl -H "Authorization: Bearer YOUR_MANUS_TOKEN" \
  https://api.manus.im/conversations \
  > conversations_backup.json
```

### Export Users
```bash
# Export user list
curl -H "Authorization: Bearer YOUR_MANUS_TOKEN" \
  https://api.manus.im/users \
  > users_backup.json
```

### Export Settings
- Screenshot admin dashboard
- Note all integrations
- Save API keys (you'll need to regenerate)

---

## Step 2: Set Up Independent Infrastructure

### Create Supabase Project
1. Go to supabase.com
2. Create new project
3. Save connection details

### Create DeepSeek Account
1. Go to platform.deepseek.com
2. Create API key
3. Add $20+ credits

### Create GitHub Repository
1. Go to github.com/new
2. Name: `workforce-luxembourg`
3. Push code

See **DEPLOYMENT_GUIDE.md** for detailed setup.

---

## Step 3: Migrate Database

### Option A: Automated Migration (Recommended)

```bash
# Export from Manus
mysqldump -u user -p manus_db > manus_backup.sql

# Import to Supabase
psql postgresql://user:pass@db.supabase.co/postgres < migration_script.sql
```

### Option B: Manual Migration

Create mapping:

```sql
-- Supabase
INSERT INTO users (email, name, role, created_at)
SELECT email, name, role, created_at
FROM manus_users;

INSERT INTO conversations (user_id, title, language, created_at)
SELECT user_id, title, language, created_at
FROM manus_conversations;

INSERT INTO messages (conversation_id, role, content, created_at)
SELECT conversation_id, role, content, created_at
FROM manus_messages;
```

### Verify Migration

```sql
-- Check record counts
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as conversation_count FROM conversations;
SELECT COUNT(*) as message_count FROM messages;
```

---

## Step 4: Update Application Code

### Remove Manus Dependencies

```bash
# Remove Manus-specific packages
pnpm remove @manus/auth @manus/llm @manus/storage

# Install replacements
pnpm add @supabase/supabase-js axios
```

### Update Environment Variables

**Old (Manus):**
```env
VITE_APP_ID=...
OAUTH_SERVER_URL=...
MANUS_API_KEY=...
```

**New (Independent):**
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
DEEPSEEK_API_KEY=...
```

### Update Authentication

**Before (Manus OAuth):**
```typescript
import { useAuth } from '@manus/auth';

const { user } = useAuth();
```

**After (Supabase):**
```typescript
import { useAuth } from '@/_core/hooks/useAuth';

const { user } = useAuth();
```

### Update LLM Calls

**Before (Manus):**
```typescript
const response = await invokeLLM({
  messages: [...],
});
```

**After (DeepSeek):**
```typescript
const response = await callDeepSeek({
  messages: [...],
  temperature: 0.3,
});
```

### Update Database Queries

**Before (Manus MySQL):**
```typescript
const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);
```

**After (Supabase PostgreSQL):**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', id);
```

---

## Step 5: Test Migration

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
# Test auth flow
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "..."}'

# Test chat
curl -X POST http://localhost:3000/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "content": "Test question"}'

# Test LLM
curl http://localhost:3000/api/health/llm
```

### Manual Testing
1. Sign up with new account
2. Start a conversation
3. Ask a question
4. Verify response format
5. Check citations
6. Test language switching

---

## Step 6: Deploy

### Deploy Frontend (Vercel)
```bash
# Push to GitHub
git push origin main

# Go to vercel.com → Import Project
# Select your repo and deploy
```

### Deploy Backend (Railway)
```bash
# Go to railway.app → New Project
# Select GitHub repo and deploy
```

### Configure Custom Domain
1. Buy domain
2. Point DNS to Vercel/Railway
3. Enable SSL

---

## Step 7: Migrate Users

### Option A: Email Notification
Send email to all users:
```
Subject: Workforce Luxembourg has moved!

We've migrated to a new, independent platform with better features.
Please sign up again at: https://your-domain.com

Your old conversations are being imported.
```

### Option B: Automated Import
```bash
# Create migration script
node scripts/migrate-users.mjs
```

Script should:
1. Read old user list
2. Create new Supabase users
3. Send password reset emails
4. Import conversations

---

## Step 8: Decommission Manus

### Before Decommissioning
- [ ] All data exported and verified
- [ ] Users migrated
- [ ] New platform tested
- [ ] Custom domain working
- [ ] Backups created

### Decommission Steps
1. Update DNS to point to new domain
2. Set Manus app to "read-only"
3. Display migration notice
4. Wait 30 days
5. Delete Manus project

---

## Troubleshooting

### "Users can't log in"
- Verify Supabase Auth is enabled
- Check email verification settings
- Verify redirect URLs

### "Conversations not showing"
- Verify data was imported
- Check user_id foreign keys
- Verify RLS policies

### "LLM responses are different"
- DeepSeek may have different behavior
- Adjust temperature/prompts
- Compare token usage

### "Performance is slower"
- Check database indexes
- Verify retrieval caching
- Monitor API response times

---

## Rollback Plan

If migration fails:

1. **Stop new deployment**
   ```bash
   vercel rollback
   railway rollback
   ```

2. **Restore Manus**
   - Revert DNS changes
   - Notify users

3. **Investigate**
   - Check logs
   - Verify data integrity
   - Test in staging

4. **Retry**
   - Fix issues
   - Test thoroughly
   - Deploy again

---

## Cost Comparison

### Manus
- Enterprise plan: $500-2000/mo
- Limited customization
- Vendor lock-in

### Independent
- Supabase: $25/mo
- DeepSeek: $50-100/mo
- Hosting: $5-20/mo
- **Total: $80-145/mo**
- Full control
- No vendor lock-in

**Savings: $355-1920/mo**

---

## Checklist

Before going live:

- [ ] Supabase project created
- [ ] DeepSeek account funded
- [ ] GitHub repository created
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Data migrated and verified
- [ ] Code updated (no Manus imports)
- [ ] Tests passing
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Custom domain configured
- [ ] SSL/HTTPS working
- [ ] Users notified
- [ ] Monitoring set up
- [ ] Backups configured

---

## Support

- **Questions**: Open GitHub issue
- **Errors**: Check logs in Vercel/Railway
- **Performance**: Monitor DeepSeek usage
- **Data**: Verify Supabase backups

---

## Next Steps

1. **Optimize**: Fine-tune prompts and retrieval
2. **Scale**: Upgrade as usage grows
3. **Enhance**: Add new features
4. **Monitor**: Set up alerts
5. **Improve**: Gather user feedback

---

**You're now independent! 🎉**

No more vendor lock-in. Full control of your data and infrastructure.
