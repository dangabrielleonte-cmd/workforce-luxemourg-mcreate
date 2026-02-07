# Workforce Luxembourg – Project TODO

## Core Features

### Database & Backend
- [x] Extend database schema with conversations, messages, sources, integrations, events tables
- [x] Implement user language preferences
- [x] Create database helpers for chat operations
- [x] Set up tRPC procedures for chat API

### AI & Retrieval
- [x] Implement LLM integration for streaming responses
- [x] Build query routing logic for three expertise modes (Procedural, Legal, AI/Innovation)
- [x] Create mode-specific answer templates
- [x] Implement citation extraction and formatting
- [ ] Integrate with Guichet.lu content retrieval system (advanced feature)

### Frontend - Standalone Interface
- [x] Build landing page with product description and example questions
- [x] Implement chat interface with message display
- [x] Build conversation sidebar with history management
- [x] Add mode selector dropdown
- [x] Implement source citation display with badges
- [x] Add conversation management (create, rename, delete)
- [ ] Create authentication pages (signup, login, password reset) - handled by Manus OAuth

### Frontend - Embedded Widget
- [ ] Create embeddable widget component
- [ ] Implement iframe embedding support
- [ ] Build script tag embedding with configuration
- [ ] Add widget configuration interface (colors, logo, language)
- [x] Implement embed code snippet generation

### Multi-Language Support
- [ ] Set up i18n framework (English, French, German)
- [ ] Create language selection UI
- [x] Implement language persistence in user preferences
- [ ] Translate all UI strings

### Admin Dashboard
- [x] Build integrations management page (list, create, edit, delete)
- [x] Implement site key generation
- [x] Create embed code snippet generator
- [ ] Build analytics dashboard (conversations, messages, top topics)
- [ ] Add user management interface
- [ ] Build admin authentication and role-based access

### Disclaimer System
- [x] Implement disclaimer templates for different query types
- [x] Add automatic disclaimer appending to responses
- [x] Create stronger disclaimers for legal/interpretative queries
- [x] Add disclaimer display in UI

### Responsive Design
- [ ] Implement desktop sidebar layout
- [ ] Build mobile-optimized collapsible navigation
- [ ] Ensure embedded widget works on mobile
- [ ] Test responsive breakpoints

## Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] Write vitest tests for LLM integration
- [x] Write vitest tests for debug router
- [x] Fix cookie domain configuration for proper persistence
- [x] Update OAuth callback with proper error handling
- [x] Add session validation and debugging endpoints
- [ ] Test chat streaming functionality
- [ ] Test query routing accuracy
- [ ] Test embedding on sample websites
- [ ] Performance optimization
- [ ] Security review and hardening
- [ ] Create deployment documentation

## Documentation
- [ ] Write README with product overview
- [ ] Create embedding guide for developers
- [ ] Document API endpoints
- [ ] Create testing checklist
- [ ] Add troubleshooting guide


## Migration to Independent Stack

### Phase 1: Fix Published App Issues
- [ ] Diagnose authentication issues on published version
- [ ] Fix session cookie handling
- [ ] Verify database connectivity
- [ ] Test OAuth flow on production

### Phase 2: Supabase Migration
- [ ] Create Supabase project and PostgreSQL database
- [ ] Migrate schema from MySQL to PostgreSQL
- [ ] Set up Supabase Auth (email/password, OAuth)
- [ ] Migrate user data to Supabase
- [ ] Update database connection strings
- [ ] Test database operations

### Phase 3: DeepSeek API Integration
- [ ] Create DeepSeek account and get API key
- [ ] Replace Manus LLM calls with DeepSeek API
- [ ] Update query routing logic for DeepSeek
- [ ] Test response streaming
- [ ] Verify cost and rate limits

### Phase 4: Authentication Migration
- [ ] Remove Manus OAuth dependencies
- [ ] Implement Supabase Auth in frontend
- [ ] Update login/signup flows
- [ ] Implement session management
- [ ] Test authentication flows

### Phase 5: GitHub Setup
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Set up GitHub Actions for CI/CD
- [ ] Configure environment secrets
- [ ] Add deployment workflows

### Phase 6: Deployment Options
- [ ] Deploy to Vercel (frontend)
- [ ] Deploy to Railway/Render (backend)
- [ ] Set up custom domain
- [ ] Configure CORS and security headers
- [ ] Test production deployment

### Phase 7: Documentation
- [ ] Create independent deployment guide
- [ ] Document API keys and setup
- [ ] Add troubleshooting guide
- [ ] Create architecture diagram
- [ ] Write cost breakdown
