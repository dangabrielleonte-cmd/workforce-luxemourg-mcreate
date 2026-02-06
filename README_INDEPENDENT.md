# Workforce Luxembourg - Independent Version

**AI-Powered HR & Employment Law Assistant for Luxembourg**

This is the fully independent version using **Supabase**, **DeepSeek API**, and **your own infrastructure**. No Manus dependencies.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Git
- (Optional) Docker for local PostgreSQL

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/workforce-luxembourg.git
cd workforce-luxembourg
```

### 2. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Credentials
Edit `.env.local`:
```env
DEEPSEEK_API_KEY=sk-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Start Development
```bash
pnpm dev
```

Visit `http://localhost:5173`

---

## 📋 What's Included

### Three-Agent Architecture
- **Orchestrator Agent**: Plans retrieval, routes to specialists
- **Guichet Agent**: Procedural HR questions (guichet.public.lu)
- **Legal Agent**: Employment law questions (legilux.public.lu, mt.gouvernement.lu)

### Exact Output Schema
```json
{
  "language": "en|fr|de",
  "answer": "...",
  "steps": ["...", "..."],
  "citations": [
    {
      "title": "...",
      "url": "https://guichet.public.lu/...",
      "section": "...",
      "retrieved_at": "2026-01-16",
      "evidence_ids": ["ev_1", "ev_3"]
    }
  ],
  "confidence": "high|medium|low",
  "limitations": ["..."],
  "suggested_searches": ["..."],
  "evidence": [...]
}
```

### Features
- ✅ Multi-language support (EN, FR, DE)
- ✅ Conversation history and management
- ✅ Citation tracking with official sources
- ✅ Confidence scoring
- ✅ Evidence-based answering
- ✅ Cost-optimized routing
- ✅ Caching for performance
- ✅ Admin dashboard
- ✅ Embeddable widget
- ✅ Role-based access control

---

## 🏗️ Architecture

### Stack
| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React 19 + Vite | Free |
| Backend | Express 4 + tRPC | Free |
| Database | Supabase (PostgreSQL) | Free-$25/mo |
| LLM | DeepSeek API | $0.14/1M tokens |
| Auth | Supabase Auth | Free |
| Hosting | Vercel + Railway | Free-$20/mo |

### Workflow
```
User Question
    ↓
Orchestrator (classify intent, plan retrieval)
    ↓
Retrieval (fetch from Guichet + Legal sources)
    ↓
Specialist Agents (process evidence)
    ├─ Guichet Agent (procedural)
    └─ Legal Agent (legal)
    ↓
Synthesis (merge responses)
    ↓
JSON Response (with citations + evidence)
```

---

## 🔧 Configuration

### Environment Variables

**Required:**
```env
DEEPSEEK_API_KEY=sk-...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional:**
```env
NODE_ENV=development|production
PORT=3000
VITE_APP_URL=http://localhost:5173
DATABASE_URL=postgresql://... (if using local DB)
REDIS_URL=redis://... (for caching)
```

### Database Schema

Automatically created by Supabase. Includes:
- `users` - User accounts
- `conversations` - Chat conversations
- `messages` - Chat messages
- `message_sources` - Citations
- `integrations` - Embedded widget configs
- `events` - Analytics events
- `user_preferences` - Language/theme settings

---

## 📦 Deployment

### Option 1: Vercel + Railway (Recommended)

**Frontend to Vercel:**
1. Push to GitHub
2. Go to vercel.com → Import Project
3. Select your repo
4. Add environment variables
5. Deploy

**Backend to Railway:**
1. Go to railway.app → New Project
2. Select GitHub repo
3. Add environment variables
4. Deploy

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Option 2: Docker

```bash
docker-compose up
```

Starts:
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)
- Backend (localhost:3000)
- Frontend (localhost:5173)

### Option 3: Self-Hosted

```bash
docker build -t workforce-luxembourg .
docker run -e DEEPSEEK_API_KEY=... -p 3000:3000 workforce-luxembourg
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Typical Usage | Cost |
|---------|-----------|---------------|------|
| Supabase | 500MB DB, 2GB storage | 1GB DB, 5GB storage | $25/mo |
| DeepSeek | - | 1M requests/mo | $50-100/mo |
| Vercel | 100GB bandwidth | 50GB bandwidth | Free |
| Railway | $5 credit | $5-10/mo | Free-$5/mo |
| Domain | - | 1 domain | $10-15/yr |
| **Total** | - | - | **$60-140/mo** |

---

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Test Specific Agent
```bash
pnpm test server/agents/orchestrator.test.ts
```

### Manual Testing
```bash
# Test orchestrator
curl -X POST http://localhost:3000/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"conversationId": 1, "content": "How do I register as a job seeker?"}'

# Test health checks
curl http://localhost:3000/health
curl http://localhost:3000/llm-health
curl http://localhost:3000/db-health
```

---

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Complete deployment instructions
- **ARCHITECTURE_REQUIREMENTS.md** - Technical architecture details
- **.github/workflows/deploy.yml** - CI/CD pipeline
- **server/agents/** - Agent implementations
- **server/retrieval/** - Retrieval layer
- **server/procedures/** - Main chat procedure

---

## 🔐 Security

### Best Practices
- ✅ Never commit `.env.local` (added to `.gitignore`)
- ✅ Use Supabase Row Level Security (RLS)
- ✅ Validate all inputs
- ✅ Rate limit API endpoints
- ✅ Use HTTPS in production
- ✅ Rotate API keys regularly
- ✅ Monitor logs for suspicious activity

### Environment Secrets
Store in your deployment platform:
- Vercel Secrets
- Railway Variables
- GitHub Secrets

Never hardcode in source code.

---

## 🐛 Troubleshooting

### "DEEPSEEK_API_KEY not set"
```bash
# Check .env.local exists and has the key
cat .env.local | grep DEEPSEEK_API_KEY

# Restart dev server
pnpm dev
```

### "Cannot connect to Supabase"
```bash
# Verify credentials
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl https://your-project.supabase.co/rest/v1/users
```

### "Responses are slow"
1. Check DeepSeek API status
2. Verify retrieval cache is working
3. Check database query performance
4. Consider upgrading DeepSeek plan

### "Deployment fails"
1. Check all environment variables are set
2. Verify database migrations ran
3. Check logs in deployment platform
4. Ensure Node.js version matches

---

## 🚀 Performance Tips

### Caching
- Retrieval results cached for 24 hours
- Use Redis for distributed caching
- Clear cache: `pnpm run cache:clear`

### Optimization
- Use conditional agent routing (don't call both if not needed)
- Limit retrieval to top results only
- Batch process multiple questions
- Monitor token usage

### Scaling
- Upgrade Supabase plan for higher concurrency
- Use read replicas for analytics queries
- Implement request queuing
- Monitor and alert on costs

---

## 📊 Analytics

Track usage in admin dashboard:
- Total conversations
- Messages per conversation
- Top questions
- Language distribution
- User engagement
- Cost per request

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit pull request

---

## 📝 License

MIT License - See LICENSE file

---

## 🆘 Support

- **Documentation**: See DEPLOYMENT_GUIDE.md
- **Issues**: GitHub Issues
- **Email**: support@example.com
- **Manus Support**: help.manus.im

---

## 🎯 Roadmap

- [ ] Advanced RAG with vector embeddings
- [ ] Multi-source evidence synthesis
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Webhook integrations
- [ ] Custom LLM fine-tuning
- [ ] Advanced analytics

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev)
- [Express](https://expressjs.com)
- [tRPC](https://trpc.io)
- [Supabase](https://supabase.com)
- [DeepSeek](https://deepseek.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Made with ❤️ for Luxembourg's HR and employment law community**

Questions? Open an issue or contact support!
