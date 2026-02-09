# Workforce Luxembourg – Guichet.lu HR & Employment Law Assistant

An AI-powered assistant that provides grounded answers about Luxembourg HR procedures, employment law, and support programmes using official Guichet.lu sources. The application can be embedded into third-party websites or used as a standalone test interface.

## Features

### Core Functionality

**AI Chat Assistant**
- Streaming responses powered by LLM integration
- Automatic query routing to three expertise modes: Procedural HR, Employment Law, and AI/Innovation Programmes
- Multi-turn conversations with context retention
- Citation system displaying official sources with badges

**Expertise Modes**
- **Procedural HR**: Step-by-step processes and workflows (e.g., job-seeker registration, inclusion assistance applications)
- **Employment Law**: Legal structures, obligations, and rights (e.g., temporary agency work conditions)
- **AI/Innovation**: Support programmes and eligibility information (e.g., SME AI packages, Fit 4 AI)

**Multi-Language Support**
- English, French, and German
- Language selection and persistent user preferences
- Automatic language detection in responses

**Conversation Management**
- Create, rename, and delete conversations
- Conversation history sidebar
- Persistent storage for authenticated users

**Disclaimer System**
- Automatic legal disclaimers appended to responses
- Mode-specific disclaimer strength (stronger for legal queries)
- Clear positioning that this is not legal advice

**Embeddable Widget**
- Iframe embedding for third-party websites
- Script tag integration with configuration
- Customizable colors, logos, and default language
- Configurable expertise mode defaults

**Admin Dashboard**
- Integration management (create, configure, delete)
- Site key generation for embedded widgets
- Embed code snippet generation (iframe and script)
- Analytics and usage tracking

## Architecture

### Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11 + Drizzle ORM
- **Database**: MySQL/TiDB
- **Authentication**: Manus OAuth
- **AI Integration**: LLM API (Claude/GPT)

### Project Structure

```
client/
  src/
    pages/
      Home.tsx              # Landing page
      ChatInterface.tsx     # Main chat interface
      Integrations.tsx      # Integration management
    components/
      ChatMessage.tsx       # Message display component
      ChatInput.tsx         # Input and mode selector
    lib/trpc.ts            # tRPC client
    App.tsx                # Routes and layout

server/
  routers/
    chat.ts                # Chat procedures
    integrations.ts        # Integration procedures
  llm.ts                   # LLM integration and routing
  db.ts                    # Database helpers

drizzle/
  schema.ts                # Database schema

shared/
  types.ts                 # Shared types and constants
```

## Database Schema

### Core Tables

**users**
- User authentication and profile information
- Role-based access control (user/admin)

**conversations**
- Chat session storage
- Supports authenticated users and embedded scenarios
- Language and title tracking

**messages**
- Individual messages in conversations
- Sender type (user/assistant/system)
- Expertise mode tracking

**messageSources**
- Citation and reference tracking
- Source type classification (guichet, official, other)

**integrations**
- Embedded widget configurations
- Site key management
- Custom branding and settings

**userPreferences**
- Language preferences
- User-specific settings

**events**
- Analytics and usage tracking
- Event type classification

## API Endpoints

### Chat Procedures

- `chat.createConversation` - Create new conversation
- `chat.listConversations` - Get user's conversations
- `chat.getConversation` - Get conversation with messages
- `chat.sendMessage` - Send message and get AI response
- `chat.getPreferences` - Get user preferences
- `chat.updatePreferences` - Update user preferences
- `chat.deleteConversation` - Delete conversation
- `chat.renameConversation` - Rename conversation

### Integration Procedures

- `integrations.createIntegration` - Create new integration
- `integrations.listIntegrations` - List user's integrations
- `integrations.getIntegration` - Get integration details
- `integrations.getAnalytics` - Get integration analytics
- `integrations.generateEmbedCode` - Generate embed snippet
- `integrations.updateConfig` - Update integration config
- `integrations.deleteIntegration` - Delete integration

## Getting Started

### Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up database**
   ```bash
   pnpm db:push
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

### Environment Variables

Required environment variables (automatically injected by Manus):
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend URL
- `BUILT_IN_FORGE_API_KEY` - LLM API key
- `BUILT_IN_FORGE_API_URL` - LLM API endpoint

## Embedding the Widget

### Option 1: iframe Embedding

```html
<iframe
  src="https://workforce-luxembourg.manus.space/embed?siteKey=YOUR_SITE_KEY"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>
```

### Option 2: Script Tag Embedding

```html
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://workforce-luxembourg.manus.space/embed.js';
    script.setAttribute('data-site-key', 'YOUR_SITE_KEY');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

## Query Routing

The system automatically classifies user queries into appropriate expertise modes:

**Procedural Detection**
- Keywords: "how to", "steps", "process", "register", "apply", "procedure"
- Examples: "How do I register as a job-seeker?", "What are the steps for inclusion assistance?"

**Legal Detection**
- Keywords: "obligations", "rights", "conditions", "requirements", "law", "legal"
- Examples: "What are the obligations for temporary agency work?", "What are employee rights?"

**AI/Innovation Detection**
- Keywords: "AI", "support", "programme", "SME", "innovation", "funding"
- Examples: "What AI support is available for SMEs?", "What programmes exist?"

## Disclaimers

All responses include appropriate disclaimers:

**General Disclaimer**
> This is general information based on public sources such as Guichet.lu. It is not legal or professional advice. For decisions with legal impact, consult a qualified lawyer or HR specialist.

**Legal Disclaimer** (for legal/interpretative queries)
> This is general information and not legal advice. Laws and regulations can change. Translations or summaries may simplify legal language. You remain responsible for verifying crucial information. For legal decisions, consult a qualified lawyer.

**Procedural Disclaimer**
> This information is based on official sources. Procedures and requirements may change. Always verify with the official sources linked below before taking action.

## Testing

### Unit Tests

Run all tests:
```bash
pnpm test
```

Test files:
- `server/auth.logout.test.ts` - Authentication tests
- `server/llm.test.ts` - LLM integration tests
- `server/routers/chat.test.ts` - Chat router tests

### Manual Testing Checklist

1. **Procedural Question**
   - Ask: "How do I register as a job-seeker with ADEM?"
   - Verify: Steps are listed, sources are cited, mode is "Procedural HR"

2. **Legal Question**
   - Ask: "What are the conditions and obligations for temporary agency work in Luxembourg?"
   - Verify: Structure includes obligations, legal disclaimer is shown, mode is "Employment Law"

3. **AI/Innovation Question**
   - Ask: "What AI support programmes are available for SMEs in Luxembourg?"
   - Verify: Programmes are listed, eligibility criteria shown, mode is "AI & Innovation"

4. **Multi-Language**
   - Switch language to French/German
   - Verify: UI and responses are in selected language

5. **Conversation Management**
   - Create multiple conversations
   - Rename and delete conversations
   - Verify: Sidebar updates correctly

6. **Embedding**
   - Embed widget on test page
   - Verify: Widget loads, chat works, styling applies

## Compliance & Positioning

**Important**: This application is **not** an official service of the Luxembourg government or Guichet.lu.

**Positioning**
- "An AI assistant that uses official public sources such as Guichet.lu to provide practical HR and employment information for Luxembourg"
- Clear disclaimer that this is not legal advice
- Emphasis on verifying information with official sources

**Data Handling**
- Conversations are stored securely
- User data is protected according to GDPR
- No personal data is shared with third parties

## Future Enhancements

- **Advanced Retrieval**: Direct integration with Guichet.lu API for real-time content
- **Analytics Dashboard**: Detailed usage analytics and topic trending
- **Multi-Tenant Support**: Support for multiple organizations
- **Custom Training**: Fine-tuning on organization-specific policies
- **Mobile App**: Native iOS/Android applications
- **Voice Integration**: Voice input and output support
- **Document Upload**: Analysis of user-provided documents

## Support & Feedback

For issues, feature requests, or feedback, please contact the support team or submit an issue in the project repository.

## License

This project is proprietary and confidential.

---

**Last Updated**: February 2026
**Version**: 1.0.0
# Railway rebuild trigger
