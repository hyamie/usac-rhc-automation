# USAC RHC Automation - Manual Deployment Steps

## Status
- [x] Local git initialized and committed
- [x] Dashboard dependencies installed
- [ ] GitHub repository created
- [ ] Supabase project created
- [ ] Vercel deployment completed

---

## Step 1: Create GitHub Repository

Since GitHub CLI authentication is pending, please create the repository manually:

1. Go to https://github.com/new
2. Repository name: `usac-rhc-automation`
3. Description: "Automated pipeline for USAC RHC Form 465 clinic outreach"
4. Visibility: **Public** (or Private if preferred)
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

After creating, run these commands to push:

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation
git remote add origin https://github.com/YOUR_USERNAME/usac-rhc-automation.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Create Supabase Project

### 2.1 Create New Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Project Name: `usac-rhc-automation`
4. Database Password: **Save this securely!**
5. Region: Choose closest to your users (e.g., US East)
6. Click "Create new project"

Wait 2-3 minutes for project to be provisioned.

### 2.2 Run Database Schema

1. In your new Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of: `C:\ClaudeAgents\projects\usac-rhc-automation\database\schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press Ctrl+Enter
6. Verify: You should see success messages for table creation

### 2.3 Get Supabase Credentials

1. Go to **Project Settings** > **API**
2. Note down these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Starts with `eyJhbGc...`
   - **service_role key**: Starts with `eyJhbGc...` (keep secret!)

### 2.4 Create Local .env.local

Create file: `C:\ClaudeAgents\projects\usac-rhc-automation\dashboard\.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# n8n (will be filled after workflow deployment)
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/enrichment

# App URL (will update after Vercel deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation\dashboard

# Link to Vercel (creates new project)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: hyamie
# - Link to existing project? No
# - Project name: usac-rhc-automation
# - Which directory is your code located? ./
# - Override settings? No

# After initial deployment, set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key

vercel env add N8N_ENRICHMENT_WEBHOOK_URL
# Use: https://hyamie.app.n8n.cloud/webhook/enrichment

vercel env add NEXT_PUBLIC_APP_URL
# Use your Vercel deployment URL

# Deploy to production with env vars:
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import Git Repository:
   - Connect your GitHub account
   - Select `usac-rhc-automation` repository
3. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: `dashboard`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Environment Variables:
   - Add all variables from .env.local above
5. Click "Deploy"

---

## Step 4: Import n8n Workflows

1. Log in to n8n: https://hyamie.app.n8n.cloud
2. For each workflow file in `workflows/`:
   - Click "+ Add workflow" > "Import from File"
   - Select the workflow JSON file
   - Save the workflow
3. Update workflow credentials:
   - Add Supabase credentials (service_role key)
   - Add Claude API credentials
   - Add Microsoft Outlook credentials
4. Activate workflows:
   - Main Daily Workflow (runs at 7 AM daily)
   - Rule Monitor Workflow (runs weekly)

Get the enrichment webhook URL from the enrichment workflow and update:
- Vercel environment variable `N8N_ENRICHMENT_WEBHOOK_URL`
- Local `.env.local`

---

## Step 5: Verify Deployment

1. **Dashboard**: Visit your Vercel URL
   - Should load without errors
   - Check browser console for any API errors

2. **Database**: In Supabase dashboard
   - Go to Table Editor
   - Verify tables exist: `clinics_pending_review`, `usac_historical_filings`, `system_alerts`

3. **n8n Workflows**:
   - Test the enrichment webhook manually
   - Check execution history

---

## Deployment URLs

After completing the steps above, document your URLs here:

- **GitHub Repository**: https://github.com/YOUR_USERNAME/usac-rhc-automation
- **Supabase Project**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
- **Vercel Dashboard**: https://vercel.com/hyamie/usac-rhc-automation
- **Live App**: https://usac-rhc-automation.vercel.app (or your custom domain)
- **n8n Instance**: https://hyamie.app.n8n.cloud

---

## Next Steps After Deployment

1. Add test data to `clinics_pending_review` table
2. Test manual enrichment button in dashboard
3. Test email generation workflow
4. Set up monitoring/alerts
5. Configure custom domain (optional)
6. Set up backup strategy for Supabase

---

## Support Files

- Database Schema: `database/schema.sql`
- n8n Workflows: `workflows/01-main-daily-workflow.json`, `workflows/02-enrichment-sub-workflow.json`, `workflows/03-rule-monitor-workflow.json`
- Environment Variables Guide: `ENV_VARIABLES.md`
- Architecture Docs: `docs/`
