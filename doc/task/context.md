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

### 2025-11-09
- **Completed:** n8n workflow imported and configured
- **Why:** Core automation pipeline needed
- **Outcome:** Main workflow operational on n8n Cloud

### 2025-11-08
- **Completed:** Supabase database setup
- **Why:** Need PostgreSQL backend for data storage
- **Outcome:** Database schema deployed, accessible

---

## Current State

**What's Working:**
- n8n workflow deployed to cloud
- Supabase database operational
- Database schema defined
- Documentation complete (architecture, schema, workflows)

**Known Issues:**
- Dashboard not yet built
- Email integration not tested
- Date filter issue in workflow (needs fix)
- Real-time sync not configured

**Next Steps:**
1. Build Next.js dashboard
2. Fix date filter in n8n workflow
3. Configure email integration (Outlook API)
4. Test end-to-end automation
5. Deploy dashboard to production

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
