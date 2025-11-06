# Complete Deployment Guide

This guide will help you deploy the entire USAC RHC Automation system.

---

## <¯ Deployment Overview

### What's Ready to Deploy NOW
-  **Database Schema** - Complete SQL, ready to run in Supabase
-  **n8n Workflows** - 3 complete workflows, ready to import
-  **Dashboard Foundation** - TypeScript, Supabase clients, types, config

### What Needs Implementation
-   **Dashboard UI Components** - React components for clinic list, enrichment, alerts
-   **Dashboard Pages** - App Router pages and layouts
-   **API Routes** - Next.js API routes for n8n webhooks

---

## =Ë Deployment Checklist

### Phase 1: Database Setup (15 minutes)

1. **Create Supabase Project**
   ```
   Go to: https://supabase.com
   Click: New Project
   Name: usac-rhc-automation
   Password: [generate strong password]
   Region: [closest to you]
   ```

2. **Run Database Schema**
   ```
   1. Go to SQL Editor in Supabase dashboard
   2. Click "New Query"
   3. Copy contents of: database/schema.sql
   4. Paste and click "Run"
   5. Verify: 3 tables created in Table Editor
   ```

3. **Get API Keys**
   ```
   Go to: Settings ’ API
   Copy:
   - Project URL: https://xxx.supabase.co
   - anon public key: eyJ...
   - service_role key: eyJ... (keep secret!)

   Save these in: ../ENV_VARIABLES.md
   ```

**Result:**  Database ready with tables, indexes, and RLS policies

---

### Phase 2: n8n Workflows (30 minutes)

1. **Login to n8n**
   ```
   URL: https://hyamie.app.n8n.cloud
   (Already configured in your Claude Desktop)
   ```

2. **Configure Credentials**

   In n8n, go to **Credentials** ’ **New**:

   **A. Supabase Service Role** (HTTP Header Auth)
   - Name: `Supabase Service Role`
   - Header Name: `apikey`
   - Header Value: [your service_role key]

   **B. USAC API Key** (HTTP Header Auth)
   - Name: `USAC API Key`
   - Header Name: `Authorization`
   - Header Value: `Bearer [your USAC key]`

   **C. Hunter.io** (HTTP Query Auth)
   - Name: `Hunter.io API Key`
   - Parameter Name: `api_key`
   - Parameter Value: [your Hunter.io key]

   **D. Anthropic** (Anthropic API)
   - Name: `Anthropic API Key`
   - API Key: [your Anthropic key]

   **E. Microsoft Outlook** (OAuth2)
   - Name: `Microsoft Outlook OAuth`
   - Follow OAuth flow to connect

3. **Import Workflows**
   ```
   For each workflow JSON file:
   1. Click "Workflows" ’ "Import from File"
   2. Select workflow JSON
   3. Click "Import"
   4. Open workflow
   5. Verify all credential dropdowns are set
   6. Click "Save"
   ```

   Import:
   - workflows/01-main-daily-workflow.json
   - workflows/02-enrichment-sub-workflow.json
   - workflows/03-rule-monitor-workflow.json

4. **Set Environment Variables in n8n**
   ```
   Go to: Settings ’ Environments
   Add:
   - SUPABASE_URL=https://xxx.supabase.co
   - SUPABASE_SERVICE_KEY=[your service_role key]
   - USAC_API_URL=https://api.usac.gov/rhc
   ```

5. **Activate Workflows**
   ```
   For each workflow:
   1. Open workflow
   2. Toggle "Active" to ON (top right)
   3. Verify green checkmark appears
   ```

6. **Get Enrichment Webhook URL**
   ```
   1. Open: 02-enrichment-sub-workflow
   2. Click "Webhook Trigger" node
   3. Copy "Production URL"
   4. Save this URL for dashboard .env.local

   Example: https://hyamie.app.n8n.cloud/webhook/abc123-enrichment
   ```

**Result:**  3 workflows active and ready to process data

---

### Phase 3: Dashboard Implementation (2-4 hours)

#### Step 3.1: Install Dependencies

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation\dashboard
npm install
```

#### Step 3.2: Configure Environment

```bash
# Copy example
copy .env.local.example .env.local

# Edit .env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/abc123
N8N_WEBHOOK_TOKEN=optional_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Step 3.3: Install shadcn/ui Components

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install components
npx shadcn-ui@latest add button card badge table alert select checkbox dialog skeleton
```

#### Step 3.4: Generate Database Types

```bash
# From dashboard directory
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

#### Step 3.5: Implement Missing Components

**You need to create these files:**

1. `src/app/providers.tsx` - TanStack Query provider
2. `src/app/layout.tsx` - Root layout with providers
3. `src/app/page.tsx` - Landing page
4. `src/app/(dashboard)/layout.tsx` - Dashboard layout with nav
5. `src/app/(dashboard)/page.tsx` - Main clinic list page
6. `src/app/(dashboard)/api/enrichment/route.ts` - API route
7. `src/hooks/use-clinics.ts` - Clinic data hooks
8. `src/hooks/use-alerts.ts` - Alert hooks
9. `src/components/clinics/ClinicList.tsx` - Clinic list component
10. `src/components/clinics/ClinicCard.tsx` - Clinic card component
11. `src/components/clinics/EnrichmentButton.tsx` - Enrichment button
12. `src/components/alerts/AlertBanner.tsx` - Alert banner

**See SETUP.md for code examples and patterns for each file.**

#### Step 3.6: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

#### Step 3.7: Test Locally

1.  Supabase connection (should see clinics if data exists)
2.  Enrichment button triggers n8n webhook
3.  Real-time updates work
4.  Alert banner displays USAC updates

---

### Phase 4: Production Deployment (30 minutes)

#### Step 4.1: Push to GitHub

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation
git init
git add .
git commit -m "USAC RHC Automation System - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/usac-rhc-automation.git
git push -u origin main
```

#### Step 4.2: Deploy to Vercel

```
1. Go to: https://vercel.com
2. Click: "Import Project"
3. Select: your GitHub repo
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: dashboard
   - Build Command: npm run build
   - Output Directory: .next
5. Add Environment Variables:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   N8N_ENRICHMENT_WEBHOOK_URL=...
   N8N_WEBHOOK_TOKEN=...
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
6. Click: "Deploy"
```

#### Step 4.3: Configure Custom Domain (Optional)

```
1. In Vercel project settings
2. Go to: Domains
3. Add: your-domain.com
4. Follow DNS configuration steps
```

#### Step 4.4: Post-Deployment Checks

- [ ] Dashboard loads at production URL
- [ ] Supabase connection works
- [ ] Enrichment webhook accessible from dashboard
- [ ] n8n workflows can reach production dashboard
- [ ] SSL certificate active (automatic with Vercel)

---

## =' Troubleshooting

### Database Issues

**"Table already exists"**
```sql
-- Drop and recreate
DROP TABLE IF EXISTS clinics_pending_review CASCADE;
DROP TABLE IF EXISTS usac_historical_filings CASCADE;
DROP TABLE IF EXISTS system_alerts CASCADE;
-- Then re-run schema.sql
```

### n8n Issues

**"Invalid credentials"**
- Re-check API keys have no extra spaces
- Verify environment variables are set
- Test credentials individually

**"Webhook not found"**
- Workflow must be ACTIVE (toggle ON)
- Check webhook URL matches exactly
- Test with curl first

### Dashboard Issues

**"Module not found"**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**"Supabase connection failed"**
- Verify NEXT_PUBLIC_ prefix on client vars
- Check .env.local exists and has correct values
- Restart dev server after env changes

**"Type errors"**
```bash
# Regenerate types
npx supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts
```

---

## =Ê Monitoring After Deployment

### Daily Checks
- [ ] Check n8n execution logs for errors
- [ ] Verify new clinics appear in dashboard
- [ ] Check email drafts in Outlook

### Weekly Checks
- [ ] Review processed clinic count
- [ ] Check USAC rule monitor ran successfully
- [ ] Verify enrichment success rate

### Monthly Maintenance
- [ ] Review API usage (Hunter.io, Claude, etc.)
- [ ] Update dependencies: `npm update`
- [ ] Rotate API keys
- [ ] Review Supabase storage usage

---

## <¯ Success Criteria

Your deployment is successful when:

 Database has 3 tables with RLS policies
 n8n shows 3 active workflows
 Dashboard shows "Connected to Supabase"
 Enrichment button triggers n8n webhook
 Email drafts appear in Outlook after enrichment
 USAC alerts appear in dashboard banner
 Real-time updates work (test by manually adding clinic in Supabase)

---

## <˜ Need Help?

1. **Database Issues**: See `database/SETUP.md`
2. **Workflow Issues**: See `workflows/SETUP.md`
3. **Dashboard Issues**: See `dashboard/SETUP.md`
4. **Environment Variables**: See `ENV_VARIABLES.md`
5. **Architecture Questions**: See `docs/01-architecture.md`

---

## =Þ Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [n8n Docs](https://docs.n8n.io/)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## <‰ You're Done!

Once all checks pass, your USAC RHC Automation system is live and processing clinics automatically!
