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

### 2025-11-11
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
🚀 **Phase 4: Smart Outreach System** (Starting Now)
- Template-based A/B/C email system
- Weekly performance optimization
- Draft-based workflow (manual review before send)
- Perplexity AI enrichment
- Learning from edits

**Next Steps:**
1. Create Phase 4 database tables (email_templates, email_instances, etc.)
2. Bootstrap voice model from extracted_emails.json
3. Generate first 3 weekly templates using Mike's voice profile
4. Build n8n "Outreach Email Generation" workflow
5. Test with 1 clinic
6. Set up O365 integration for draft creation

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
