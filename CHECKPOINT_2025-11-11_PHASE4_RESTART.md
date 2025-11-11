# USAC RHC Automation - Phase 4 Restart Checkpoint
## Date: November 11, 2025

---

## 🎯 SESSION SUMMARY

### **What We Just Did:**

1. **Reviewed Project State**
   - Confirmed Phases 1-3.5 are COMPLETE
   - Dashboard is live and production-ready at Vercel
   - All 7 filters working, tested with Playwright

2. **Analyzed Infrastructure Changes**
   - Discovered major MCP upgrades since last session (Nov 10)
   - Found MCP profile system (can switch between tool sets)
   - Identified n8n MCP, Supabase MCP, Memory MCP availability
   - Recognized file-based orchestration pattern (doc/ directory)

3. **Updated Phase 4 Approach**
   - Switched from manual workflow building → n8n MCP direct control
   - Switched from SQL files → Supabase MCP direct operations
   - Added Memory MCP for learning patterns
   - Updated context.md with current state

4. **Switched MCP Profile**
   - Changed from "donnie" (12 servers) → "webapp" (9 servers)
   - New profile includes: n8n, Supabase, Playwright, n8n-workflows-docs
   - Backed up previous config to .mcp.backup.json

---

## 🔄 RESTART REQUIRED

**Why**: MCP profile changes only take effect after restart

**When you restart Claude Code, you'll have access to:**
- ✅ n8n MCP - Build workflows programmatically
- ✅ Supabase MCP (usac) - Database operations directly
- ✅ Supabase MCP (hana) - Secondary database
- ✅ Playwright MCP - Browser testing
- ✅ n8n-workflows-docs - Workflow documentation
- ✅ filesystem, git, github, context7 (core tools)

---

## 📋 WHAT TO DO AFTER RESTART

### **Say to Donnie:**

> "Continue Phase 4.1 using the new MCP tools"

### **Donnie will:**

1. Read `doc/task/context.md` (already updated with current state)
2. Read this checkpoint for detailed context
3. Begin Phase 4.1 Foundation using MCP tools:

#### **Step 1: Create Phase 4 Database Tables**
Use **Supabase MCP** to create:
- `email_templates` - Weekly A/B/C template versions
- `email_instances` - Each actual email sent
- `template_edits` - Mike's changes tracking
- `weekly_performance` - A/B/C test results
- `voice_model` - Learned writing patterns

**SQL is ready** in `PHASE4_PLAN.md` starting at line 517

#### **Step 2: Bootstrap Voice Model**
Use **Supabase MCP** to:
- Read `mike_voice_profile.json`
- Read `extracted_emails.json`
- Insert initial voice model data into database

#### **Step 3: Generate First 3 Templates**
- Use Mike's voice profile from database
- Call Claude API to generate Template A, B, C
- Store in `email_templates` table
- Mark as active for current week

#### **Step 4: Build n8n Workflow**
Use **n8n MCP** to create "Outreach Email Generation" workflow:
- Webhook trigger (from dashboard button)
- Supabase: Get clinic data
- Determine contact type (direct vs consultant)
- Get current template (rotate A/B/C)
- Perplexity: Enrich with recent info
- Render template with data
- O365: Create draft
- Supabase: Store email instance

**Detailed node design** in `PHASE4_PLAN.md` starting at line 750

#### **Step 5: Test with 1 Clinic**
Use **Playwright MCP** to:
- Load dashboard in browser
- Click "Start Outreach" on a test clinic
- Verify workflow executes
- Check draft is created
- Validate data is stored

---

## 📁 KEY FILES

### **Already Created:**
- ✅ `PHASE4_PLAN.md` - Complete implementation guide (35+ pages)
- ✅ `mike_voice_profile.json` - Analyzed voice patterns
- ✅ `extracted_emails.json` - 10 real emails from Mike
- ✅ `voice_analysis.py` - Voice analysis script
- ✅ `email examples/` - Original .msg files
- ✅ `doc/task/context.md` - Updated with current state
- ✅ `dashboard/` - Complete Next.js app (Phases 1-3.5)

### **To Be Created in Phase 4.1:**
- Phase 4 database tables (via Supabase MCP)
- Voice model data (via Supabase MCP)
- First 3 templates (via Claude API)
- n8n outreach workflow (via n8n MCP)
- Test results and screenshots

---

## 🗄️ DATABASE INFO

**Current Schema (Phases 1-3):**
- `clinics` - USAC Form 465 filers
- `enrichment_data` - AI-generated insights
- `contact_attempts` - Outreach tracking
- Plus supporting tables

**Phase 4 Will Add:**
- `email_templates` (weekly A/B/C versions)
- `email_instances` (each sent email)
- `template_edits` (learning from Mike's changes)
- `weekly_performance` (A/B/C results)
- `voice_model` (writing patterns)

**Connection**: Already configured in `dashboard/.env.local`

---

## 🔑 CREDENTIALS STATUS

### ✅ Already Have:
- Supabase (USAC project)
- Supabase (Hana CRM project)
- n8n Cloud (https://hyamie.app.n8n.cloud)
- Vercel deployment

### ⏸️ Need to Set Up:
- **Microsoft O365 / Azure AD** (for email drafts)
  - Setup guide: `PHASE4_PLAN.md` line 1085
- **Perplexity AI** (for enrichment)
  - Setup guide: `PHASE4_PLAN.md` line 1126
- **Claude API** (for template generation)
  - Setup guide: `PHASE4_PLAN.md` line 1142
- **SPF/DKIM/DMARC** (for deliverability)
  - Setup guide: `PHASE4_PLAN.md` line 1176

**Note**: We can start Phase 4.1 steps 1-3 without these, set them up for steps 4-5

---

## 💡 KEY ARCHITECTURAL DECISIONS

### **1. Template-Based A/B/C System**
- Generate 3 templates every Monday ($0.45 total)
- Rotate across all clinics during week ($0.005 enrichment each)
- Track which template performs best
- Regenerate next week based on winner
- **Cost**: ~$6/month vs $188/month (97% savings!)

### **2. Draft-Based Workflow**
- n8n creates draft in O365
- Mike reviews/edits in Outlook
- Mike sends manually
- System learns from edits
- Builds trust before full automation

### **3. Mike's Voice Profile**
- Analyzed 10 real emails
- 16 words/sentence average
- Specific phrases identified ("I saw", "Let me know", "We can")
- Avoids AI language completely
- Conversational-professional hybrid tone

### **4. MCP-First Implementation**
Instead of manual operations:
- ✅ n8n MCP builds workflows
- ✅ Supabase MCP manages database
- ✅ Memory MCP stores learnings
- ✅ Playwright MCP tests functionality

---

## 🎯 SUCCESS CRITERIA - PHASE 4.1 (Week 1)

By end of Week 1:
- [ ] 5 new database tables created
- [ ] Voice model bootstrapped with data
- [ ] 3 templates generated (A/B/C)
- [ ] n8n workflow operational
- [ ] 1 test email successfully created
- [ ] Dashboard has "Start Outreach" button
- [ ] 0 errors in production

---

## 📊 CURRENT DEPLOYMENT STATUS

**Dashboard:**
- URL: https://dashboard-cnlhk990t-mike-hyams-projects.vercel.app
- Status: ✅ Live
- Features: All 7 filters, map, timeline, search, dark mode
- Last Update: Nov 9

**n8n Cloud:**
- URL: https://hyamie.app.n8n.cloud
- Status: ✅ Accessible
- Current Workflows: 1 (existing data processing)
- Phase 4 Will Add: 2 new workflows

**Supabase:**
- Status: ✅ Operational
- Tables: 12+ (Phases 1-3)
- Phase 4 Will Add: 5 tables

---

## 🚦 WHERE WE ARE IN THE ROADMAP

- ✅ **Phase 1:** Database schema & Supabase setup (COMPLETE)
- ✅ **Phase 2:** Dashboard foundation (COMPLETE)
- ✅ **Phase 3:** Advanced UI features (COMPLETE)
- ✅ **Phase 3.5:** Visual overhaul, animations, map (COMPLETE)
- 🚀 **Phase 4.1:** Foundation (STARTING NOW - Week 1)
  - Create database tables
  - Bootstrap voice model
  - Generate first templates
  - Build n8n workflow
  - Test with 1 clinic
- ⏸️ **Phase 4.2:** Learning System (Week 2)
- ⏸️ **Phase 4.3:** Optimization (Week 3)
- ⏸️ **Phase 4.4:** Scale & Polish (Week 4)

---

## 📞 HANDOFF MESSAGE

**After you restart Claude Code:**

Say: **"Continue Phase 4.1 using the new MCP tools"**

I will:
1. Recognize we switched to webapp MCP profile
2. Verify n8n and Supabase MCPs are available
3. Read doc/task/context.md for current state
4. Read this checkpoint for detailed instructions
5. Begin Phase 4.1 Step 1: Create database tables using Supabase MCP

**No need to explain context** - everything is documented and ready to go!

---

## 🔍 QUICK REFERENCE

**Main Documents:**
- `PHASE4_PLAN.md` - Complete 35-page implementation guide
- `doc/task/context.md` - Current project state
- `CHECKPOINT_2025-11-10_PHASE4_PLANNING.md` - Previous session
- `CHECKPOINT_2025-11-11_PHASE4_RESTART.md` - This document

**Voice Profile:**
- `mike_voice_profile.json` - Structured patterns
- `extracted_emails.json` - Raw email data
- `email examples/` - Original .msg files

**MCP Profiles:**
- `.mcp.webapp.json` - Active profile (9 servers)
- `.mcp.donnie.json` - Previous profile (12 servers)
- `.mcp.backup.json` - Backup before switch

**Dashboard:**
- `dashboard/` - Next.js app
- `dashboard/.env.local` - Supabase credentials

---

## ⚡ IMMEDIATE NEXT ACTIONS

After restart, use these exact tools:

```
1. Test Supabase MCP:
   Tool: mcp__supabase-usac__<operation>
   Purpose: Verify database connectivity

2. Create email_templates table:
   Tool: mcp__supabase-usac__<create_table or execute_sql>
   SQL: From PHASE4_PLAN.md line 519

3. Create email_instances table:
   Tool: mcp__supabase-usac__<create_table or execute_sql>
   SQL: From PHASE4_PLAN.md line 552

4. Continue with remaining 3 tables...
```

---

**Git Status Before Restart:**
```
On branch: master
Modified:
  - doc/task/context.md (updated with Phase 4 status)
New files:
  - CHECKPOINT_2025-11-11_PHASE4_RESTART.md (this file)
MCP Config:
  - Switched to webapp profile
```

---

**Ready to restart!** 🚀

When you come back, we'll have n8n and Supabase MCPs ready to build Phase 4 programmatically.

---

*Checkpoint created: 2025-11-11*
*Next action: Restart Claude Code*
*Agent: Donnie*
*Status: Ready for Phase 4.1* 🎯
