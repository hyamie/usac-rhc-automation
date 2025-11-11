# Project Context - USAC RHC Automation

**Project:** USAC RHC Outreach Automation System
**Last Updated:** 2025-11-11
**Status:** Active Development

---

## Current Goal

Automate the process of identifying, ranking, enriching, and reaching out to USAC RHC Form 465 filers through an integrated n8n + Supabase + Next.js system.

---

## Architecture Overview

**Three-Tier System:**
- **Backend (n8n):** Daily automated workflows for data processing, enrichment, and email generation
- **Database (Supabase):** PostgreSQL with real-time capabilities for storing form data, enrichment results
- **Frontend (Next.js 14):** Web dashboard for manual review, triggering, and monitoring

**Technology Stack:**
- Automation: n8n Cloud (https://hyamie.app.n8n.cloud)
- Database: Supabase (PostgreSQL + real-time)
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- AI: Claude Sonnet 4.5 (email generation)
- Email: Microsoft Outlook API

---

## Recent Changes

### 2025-11-11 (Session 3)
- **Completed:** Phase 4.2 Workflow Design & Documentation
- **Why:** Create complete n8n workflow for email generation with AI enrichment
- **Outcome:** 10-node workflow JSON, 20,000+ words documentation, ready for import
- **Files:** outreach_email_generation.json, 3 comprehensive guides (spec, credentials, import)
- **Cost:** $0 (design phase)

### 2025-11-11 (Session 2)
- **Completed:** Phase 4.1 Foundation (Database + Voice Model + Templates)
- **Why:** Build foundation for Smart Outreach System with learning capabilities
- **Outcome:** 5 tables created, voice model v1 bootstrapped, 3 templates generated (A/B/C)
- **Files:** phase4_migrations.sql, phase4_bootstrap_voice_model.sql, templates_week-46-2025_direct.json
- **Cost:** $0.0145

### 2025-11-11 (Session 1)
- **Completed:** Phase 4 Planning & Infrastructure Upgrade
- **Why:** Upgraded MCP tooling, switched to webapp profile for n8n/Supabase direct access
- **Outcome:** Ready to build Phase 4 outreach system with enhanced MCP tools

### 2025-11-10
- **Completed:** Phase 4 Planning Session
- **Why:** Designed complete outreach email system with template-based A/B/C testing
- **Outcome:** Created PHASE4_PLAN.md with database schema, n8n workflows, Mike's voice profile

### 2025-11-09
- **Completed:** Phases 1-3.5 (Database + Dashboard + Visual Polish)
- **Why:** Full-featured dashboard with 7 filters, map view, timeline, search highlights
- **Outcome:** Production dashboard live at Vercel, all features tested and working

### 2025-11-08
- **Completed:** Supabase database setup
- **Why:** Need PostgreSQL backend for data storage
- **Outcome:** Database schema deployed, accessible

---

## Current State

**What's Working:**
✅ Supabase database operational with full schema
✅ Next.js dashboard deployed to Vercel (production-ready)
✅ All 7 filters working (Funding Year, State, Consultant, Date, Status, Search, View Modes)
✅ Map view with geocoding
✅ Timeline view, search highlights, dark mode
✅ n8n workflow deployed to cloud
✅ Mike's voice profile analyzed (10 real emails)
✅ Phase 4 architecture planned
✅ MCP tools upgraded (n8n, Supabase, Memory MCPs available)

**Current Phase:**
✅ **Phase 4.1: Foundation** (COMPLETE - Nov 11, 2025)
- Database schema created (5 new tables)
- Voice model bootstrapped (v1, confidence: 0.82)
- First 3 templates generated (A/B/C for week-46-2025)
- SQL migrations ready to run
- Cost: $0.0145

📦 **Phase 4.2: n8n Workflow** (READY FOR IMPORT - Nov 11, 2025)
- 10-node workflow designed (JSON ready)
- Complete documentation (20,000+ words)
- API credentials setup guide complete
- Import guide with troubleshooting ready
- Cost: $0 (design phase)

🔄 **Phase 4.2 Next:** Import & Test
- Import workflow to n8n Cloud
- Configure API credentials (Perplexity, O365)
- Test with 1 clinic
- Verify draft creation in Outlook

**Next Steps:**
1. Run database migrations (if not done)
2. Set up Perplexity AI API key
3. Configure O365 Azure AD app
4. Import workflow JSON to n8n
5. Test end-to-end with 1 clinic

---

## Key Decisions

### Database Choice - 2025-11-08
**Decision:** Use Supabase (PostgreSQL)
**Reasoning:** Real-time capabilities, PostgreSQL features, easy Next.js integration
**Alternatives Considered:** Firebase (less SQL power), Plain PostgreSQL (more setup)
**Outcome:** Successfully deployed, schema working

### Workflow Platform - 2025-11-07
**Decision:** Use n8n Cloud
**Reasoning:** Visual workflow builder, existing user expertise, cloud-hosted
**Alternatives Considered:** Zapier (expensive), custom Node.js (more work)
**Outcome:** Workflows imported and functional

---

## Team Preferences

- Prefer visual workflow tools over code (n8n)
- Prefer TypeScript for frontend
- Prefer PostgreSQL for database (SQL power)
- Prefer Tailwind CSS for styling

---

## Dependencies

**External Services:**
- n8n Cloud: https://hyamie.app.n8n.cloud (Active)
- Supabase: Database backend (Active)
- Microsoft Outlook API: Email sending (Not configured)
- USAC Public Data API: Source data (Accessible)

**Internal Systems:**
- n8n MCP: For workflow management from Claude
- Supabase MCP: For database operations from Claude

---

## Notes for Agents

**When working on USAC:**
- Always check `docs/` folder for architecture details
- Workflow JSON is in `workflows/` directory
- Use Supabase MCP for database queries
- Use n8n MCP for workflow management
- Dashboard will be deployed to Vercel

**Important Paths:**
- Workflows: `workflows/main_daily_workflow_v2_export.json`
- Database Schema: `database/schema.sql`
- Documentation: `docs/*.md`
