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
