# USAC RHC Outreach Automation System

Automated pipeline for identifying, ranking, enriching, and reaching out to USAC RHC Form 465 filers.

## System Components

1. **n8n Workflows** - Automation pipeline (daily triggers, enrichment, monitoring)
2. **Supabase Database** - PostgreSQL storage with real-time capabilities
3. **Next.js Dashboard** - Web interface for manual review and triggering

## Tech Stack

- **Automation**: n8n (https://hyamie.app.n8n.cloud)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **AI**: Claude Sonnet 4.5 (email generation)
- **Email**: Microsoft Outlook API

## Quick Start

See `PROGRESS.md` for current implementation status.

## Documentation

- `docs/01-architecture.md` - Complete system architecture
- `docs/02-database-schema.md` - Supabase database schema
- `docs/03-n8n-workflows.md` - n8n workflow designs
- `docs/04-dashboard-design.md` - Next.js dashboard design

## Original Plan

Source: `C:\ClaudeAgents\md-files\usac\usac_n8n_workflow_plan.md`
