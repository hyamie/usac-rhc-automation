# Quick Deployment Guide

## Current Status: Ready to Deploy 🚀

Everything is prepared and waiting for 2 manual prerequisites to be completed.

---

## Prerequisites (Complete These First)

### ✅ What's Already Done
- [x] Project code committed to local git
- [x] Vercel CLI authenticated as hyamie
- [x] n8n credentials configured
- [x] Dashboard dependencies installed
- [x] Database schema ready
- [x] Deployment automation script created

### ⏳ What You Need to Do Now

#### 1. Complete GitHub Authentication
**Currently Waiting:** GitHub CLI auth is in progress

**Action Required:**
1. Open: https://github.com/login/device
2. Enter code: **A019-2B80**
3. Click "Authorize GitHub CLI"

**How to verify it worked:**
```bash
"/c/Program Files/GitHub CLI/gh.exe" auth status
```

#### 2. Create Supabase Project
**Action Required:**
1. Go to: https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** usac-rhc-automation
   - **Database Password:** (create a strong password and save it!)
   - **Region:** Select closest region
4. Click "Create new project" (takes ~2 minutes)
5. Once created, copy these 3 values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Anon Key:** (from Settings > API)
   - **Service Role Key:** (from Settings > API)

---

## One-Command Deployment

Once you complete the prerequisites above, run this single command:

```bash
cd /c/ClaudeAgents/projects/usac-rhc-automation
bash deploy-automation.sh \
  "YOUR_SUPABASE_URL" \
  "YOUR_SUPABASE_ANON_KEY" \
  "YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

**Example:**
```bash
bash deploy-automation.sh \
  "https://abcdefgh.supabase.co" \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

This script will automatically:
1. ✅ Create GitHub repository and push code
2. ✅ Deploy database schema to Supabase
3. ✅ Configure dashboard environment variables
4. ✅ Deploy dashboard to Vercel
5. ✅ Generate deployment summary with all URLs

---

## What Happens During Deployment

```
[1/5] Creating GitHub repository...
  → Creates public repo: usac-rhc-automation
  → Pushes all code to GitHub
  → Outputs: Repository URL

[2/5] Deploying database schema...
  → Executes schema.sql in Supabase
  → Creates tables, indexes, RLS policies
  → Sets up views and functions

[3/5] Creating dashboard environment file...
  → Generates .env.local with Supabase credentials
  → Configures placeholder webhook URLs
  → Ready for Vercel deployment

[4/5] Deploying to Vercel...
  → Links project to Vercel
  → Sets production environment variables
  → Deploys Next.js dashboard
  → Outputs: Vercel deployment URL

[5/5] Updating documentation...
  → Generates DEPLOYMENT_SUMMARY.md
  → Lists all URLs and credentials
  → Documents remaining manual steps
```

---

## After Automated Deployment

You'll have 3 remaining manual steps:

### 1. Import n8n Workflows (5 minutes)
```bash
Location: /c/ClaudeAgents/projects/usac-rhc-automation/workflows/

Files to import:
1. USAC_Monitor.json
2. Enrichment_Pipeline.json
3. Email_Outreach.json
```

Go to https://hyamie.app.n8n.cloud → Import each workflow → Activate

### 2. Update Webhook URLs in Vercel (2 minutes)
Copy the webhook URLs from activated n8n workflows and update Vercel env vars:
```bash
vercel env add N8N_ENRICHMENT_WEBHOOK_URL production
vercel env add N8N_EMAIL_WEBHOOK_URL production
cd dashboard && vercel --prod
```

### 3. Test the System (10 minutes)
1. Open the Vercel dashboard URL
2. Add a test clinic
3. Run enrichment
4. Generate test email
5. Verify n8n workflow executions

---

## Troubleshooting

### GitHub Auth Fails
```bash
# Kill existing auth process
pkill -f "gh auth"

# Restart auth
"/c/Program Files/GitHub CLI/gh.exe" auth login --web
```

### Supabase Schema Fails
- Option 1: Use Supabase SQL Editor (copy/paste schema.sql)
- Option 2: Install PostgreSQL client and connect directly

### Vercel Deployment Fails
```bash
# Check Vercel status
vercel --debug

# Check logs
vercel logs usac-rhc-automation
```

---

## Expected Output

After successful deployment, you'll see:

```
========================================
Deployment Complete!
========================================

✅ GitHub Repository: https://github.com/hyamie/usac-rhc-automation
✅ Supabase Database: https://xxxxx.supabase.co
✅ Vercel Dashboard: https://usac-rhc-automation.vercel.app
⏳ n8n Workflows: Ready to import manually

📄 See DEPLOYMENT_SUMMARY.md for complete details

⚠️  Manual Steps Required:
  1. Import 3 n8n workflow JSON files
  2. Update webhook URLs in Vercel environment
  3. Test the complete flow

🎉 All automated steps completed successfully!
```

---

## Time Estimate

- **Prerequisites:** 5 minutes (GitHub auth + Supabase project creation)
- **Automated Deployment:** 3-5 minutes (script execution)
- **Manual n8n Setup:** 5-7 minutes (workflow import)
- **Testing:** 10 minutes

**Total:** ~25 minutes from start to fully working system

---

## Questions?

Check these files for detailed information:
- `DEPLOYMENT_SUMMARY.md` - Complete deployment details (generated after deployment)
- `dashboard/DEPLOY.md` - Dashboard-specific deployment guide
- `database/SETUP.md` - Database schema documentation
- `workflows/README.md` - n8n workflow details

---

**Ready to deploy?**
1. Complete the 2 prerequisites above
2. Run the one-command deployment
3. Follow the remaining manual steps
4. You'll have a fully working automation system! 🎉
