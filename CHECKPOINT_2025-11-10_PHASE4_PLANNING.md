# USAC RHC Automation - Phase 4 Planning Session Checkpoint
## Date: November 10, 2025

---

## 🎯 SESSION SUMMARY

### **Started With:**
- Completed Phase 3.5 (Dashboard with all features working)
- Need to start Phase 4: n8n Outreach Workflow

### **Accomplished Today:**

#### **1. Dashboard Testing** ✅
- Installed Playwright and tested dashboard locally
- Verified all 7 filters working
- Confirmed search, status filters, view modes operational
- Screenshots captured in `/screenshots/` folder
- **Result:** Dashboard is production-ready and stable

#### **2. Phase 4 Architecture Discussion** ✅
- Explored n8n outreach workflow requirements
- Decided on email service: **O365 with manual review (drafts folder)**
- Agreed on workflow trigger: **Manual via "Start Outreach" button**
- Discussed enrichment: **Perplexity AI for recent clinic/contact info**
- Clarified deliverability priority: **SPF/DKIM setup required**

#### **3. Cost-Effective Template System** ✅
- **KEY DECISION:** Weekly A/B/C templates instead of per-email generation
- Generate 3 templates every Monday
- Rotate templates across clinics during the week
- Track performance and regenerate based on learnings
- **Cost reduction:** $188/month → $5/month (97% savings!)

#### **4. Voice Profile Analysis** ✅
- Extracted and analyzed 10 of Mike's real emails
- Identified authentic writing patterns:
  - **Tone:** Conversational-Professional Hybrid
  - **Avg sentence:** 16 words
  - **Common phrases:** "I saw", "Let me know", "We can"
  - **Avoids:** AI jargon like "I hope this finds you well"
- Created voice model for template generation

#### **5. Complete Implementation Plan** ✅
- Created comprehensive `PHASE4_PLAN.md` with:
  - Database schema (5 new tables)
  - n8n workflow designs (2 workflows)
  - Dashboard UI mockups
  - 4-week implementation phases
  - Credentials setup guides
  - Success metrics

---

## 📊 KEY DECISIONS MADE

### **Email System Architecture:**
```
1. User clicks "Start Outreach" in dashboard
2. n8n fetches clinic data
3. Perplexity AI enriches with recent info
4. Template rotated (A → B → C)
5. Email rendered with enrichment
6. O365 draft created
7. Mike reviews/edits in O365
8. Mike sends manually
9. System tracks edits + performance
10. Weekly: Analyze & regenerate templates
```

### **Template System:**
- **3 templates generated weekly** (not per email)
- Template A: Professional/Formal tone
- Template B: Conversational/Warm tone
- Template C: Hybrid/Direct tone
- Templates learn from Mike's edits
- Best performer informs next week's generation

### **Cost Structure:**
- Perplexity enrichment: $0.005/email
- Template generation: $0.45/week
- **Total: ~$5/month** for 20 emails/day

### **Technology Stack:**
- **Email service:** Microsoft O365 (drafts workflow)
- **Enrichment:** Perplexity AI (real-time web search)
- **Email generation:** Claude Sonnet 3.5 (weekly templates)
- **Learning/Memory:** Database + template edit tracking
- **Automation:** n8n workflows
- **Tracking:** O365 Graph API (opens/clicks/responses)

---

## 📁 FILES CREATED TODAY

### **Email Analysis:**
1. **`email examples/`** - 10 .msg files from Mike
2. **`extract_emails.py`** - Script to parse .msg files
3. **`extracted_emails.json`** - Parsed email content
4. **`voice_analysis.py`** - Script to analyze writing style
5. **`mike_voice_profile.json`** - Structured voice patterns

### **Testing:**
1. **`test_dashboard.py`** - Playwright test suite
2. **`screenshots/`** - Dashboard screenshots
   - 01_initial_load.png
   - 02_filters_visible.png
   - 06_search_highlight.png
   - 10_final_state.png

### **Planning:**
1. **`PHASE4_PLAN.md`** - **MAIN DOCUMENT** (Complete implementation guide)
   - Database schema (SQL)
   - n8n workflow designs
   - Dashboard mockups
   - Implementation phases
   - Setup instructions

### **This Checkpoint:**
1. **`CHECKPOINT_2025-11-10_PHASE4_PLANNING.md`** - This file

---

## 🗂️ PROJECT STRUCTURE (Current State)

```
usac-rhc-automation/
├── dashboard/                      # Next.js Dashboard (COMPLETE)
│   ├── src/
│   │   ├── app/                   # App router
│   │   ├── components/            # React components
│   │   │   ├── clinics/          # Card, List, Map, Timeline
│   │   │   └── filters/          # FundingYear, State, Consultant, Date
│   │   └── lib/                   # Utils, geocoding, search-highlight
│   └── package.json
│
├── database/
│   ├── schema.sql                 # Main schema (Phase 1-3)
│   └── migrations/
│       ├── 001_*.sql             # Previous migrations
│       └── 002_add_geocoding_fields.sql  # ✅ RUN (you did this)
│
├── workflows/
│   └── main_daily_workflow_v2_export.json  # Existing n8n workflow
│
├── email examples/                # ✅ NEW TODAY
│   └── *.msg                     # 10 emails from Mike
│
├── screenshots/                   # ✅ NEW TODAY
│   └── *.png                     # Dashboard test screenshots
│
├── docs/
│   ├── CHECKPOINT_2025-11-09_END_OF_DAY.md
│   ├── CHECKPOINT_2025-11-10_PHASE4_PLANNING.md  # ✅ THIS FILE
│   └── IMPORT_WORKFLOW_INSTRUCTIONS.md
│
├── PHASE4_PLAN.md                 # ✅ NEW TODAY - MAIN GUIDE
├── extract_emails.py              # ✅ NEW TODAY
├── extracted_emails.json          # ✅ NEW TODAY
├── voice_analysis.py              # ✅ NEW TODAY
├── mike_voice_profile.json        # ✅ NEW TODAY
└── test_dashboard.py              # ✅ NEW TODAY
```

---

## 🎨 MIKE'S VOICE PROFILE (Quick Reference)

**From analysis of 10 real emails:**

### **Tone:**
- Conversational-Professional Hybrid
- Not overly formal, but maintains professionalism
- Warm without being excessive

### **Sentence Structure:**
- Average: 16 words per sentence
- 27.5% short (< 10 words)
- 42.5% medium (10-20 words)
- 30% long (> 20 words)

### **Common Phrases:**
- "I saw" (used 3x)
- "Let me know" (3x)
- "We can" (5x)
- "Do you have" (2x)
- "Happy to"
- "Let us know"

### **Opening Style:**
- References recent events: "I saw your 465 posting"
- Gets to point quickly
- Mentions specific details

### **Closing Style:**
- Simple: "Thanks,", "Let me know"
- Often offers help: "Let us know if we can help"
- Sometimes casual: "Have a great weekend"

### **Subject Lines:**
- Direct and USAC-focused
- Short (3-5 words)
- Examples: "USAC 465 posting", "USAC Bid"

### **AVOID (Not in Mike's style):**
- "I hope this email finds you well"
- "Please don't hesitate"
- "At your earliest convenience"
- "Circle back"
- "Touch base"
- "Just reaching out"

---

## 📋 DATABASE SCHEMA (Phase 4 - NOT YET CREATED)

### **Tables to Create:**

1. **`email_templates`**
   - Weekly A/B/C template versions
   - Subject and body templates with placeholders
   - Performance metrics (opens, responses, etc.)

2. **`email_instances`**
   - Each actual email sent
   - Links to clinic and template
   - Tracks O365 draft ID
   - Stores rendered content
   - Records user edits

3. **`template_edits`**
   - Captures Mike's changes before sending
   - Identifies patterns
   - Feeds learning system

4. **`weekly_performance`**
   - Weekly A/B/C test results
   - Winner identification
   - Key learnings
   - Recommendations

5. **`voice_model`**
   - Learned writing patterns
   - Tone profile
   - Preferred/avoid phrases
   - Sentence patterns

**📝 Full SQL in `PHASE4_PLAN.md` starting at line 517**

---

## 🔄 N8N WORKFLOWS (Phase 4 - NOT YET BUILT)

### **Workflow 1: Outreach Email Generation**

**Trigger:** Webhook (from "Start Outreach" button)

**Flow:**
1. Webhook receives `{clinic_id}`
2. Supabase: Get clinic data
3. Function: Determine contact type (direct vs consultant)
4. Supabase: Get current week's template (rotate A/B/C)
5. Perplexity: Enrich with recent clinic/contact info ($0.005)
6. Function: Render template with data
7. O365 Graph API: Create draft
8. Supabase: Store email instance
9. Response: Return draft URL to dashboard

**📝 Detailed node design in `PHASE4_PLAN.md` starting at line 750**

### **Workflow 2: Weekly Template Generation**

**Trigger:** Schedule (Monday 6 AM)

**Flow:**
1. Cron trigger
2. Supabase: Get last week's performance
3. Supabase: Get voice model
4. Function: Build generation prompt
5. Claude Sonnet: Generate 3 new templates ($0.45)
6. Function: Parse response
7. Supabase: Store new templates
8. Supabase: Retire old templates
9. Notification: Slack/Email

**📝 Detailed node design in `PHASE4_PLAN.md` starting at line 835**

---

## 🔑 CREDENTIALS NEEDED (Phase 4)

### **1. Microsoft O365 / Azure AD**
- **Status:** ⏸️ Not set up yet
- **Need:**
  - App Registration in Azure AD
  - Client ID
  - Client Secret
  - OAuth 2.0 tokens
  - Permissions: `Mail.ReadWrite`, `Mail.Send`
- **Setup guide:** `PHASE4_PLAN.md` line 1085

### **2. Perplexity AI**
- **Status:** ⏸️ Not set up yet
- **Need:**
  - API key from perplexity.ai
  - Model: `llama-3.1-sonar-small-128k-online`
- **Setup guide:** `PHASE4_PLAN.md` line 1126

### **3. Claude (Anthropic)**
- **Status:** ⏸️ Not set up yet
- **Need:**
  - API key from console.anthropic.com
  - Model: `claude-sonnet-3-5-20241022`
- **Setup guide:** `PHASE4_PLAN.md` line 1142

### **4. Supabase**
- **Status:** ✅ Already configured (Phase 1-3)
- **Credentials:** In `.env.local`

### **5. SPF/DKIM/DMARC**
- **Status:** ⚠️ Need to verify/configure
- **Purpose:** Email deliverability (avoid spam)
- **Setup guide:** `PHASE4_PLAN.md` line 1176

---

## 🎯 IMPLEMENTATION PHASES (4 Weeks)

### **Phase 4.1: Foundation (Week 1)**
- Create database tables
- Bootstrap voice model
- Generate first 3 templates
- Build basic n8n workflow
- Test with 1 clinic

### **Phase 4.2: Learning System (Week 2)**
- Edit tracking webhook
- Diff algorithm for changes
- Template update logic
- O365 tracking (opens/clicks)
- Template Management dashboard

### **Phase 4.3: Optimization (Week 3)**
- Weekly performance analysis
- Automated template regeneration
- Enhanced analytics
- Email history on clinic cards
- Follow-up reminders

### **Phase 4.4: Scale & Polish (Week 4)**
- Consultant templates
- Batch processing UI
- Email preview improvements
- Duplicate prevention
- Production monitoring

**📝 Detailed breakdown in `PHASE4_PLAN.md` starting at line 1200**

---

## 📊 SUCCESS METRICS (Targets)

### **Week 1:**
- System operational
- 5 test emails created
- 0 errors

### **Week 4:**
- 100+ emails sent
- 60%+ open rate
- 15%+ response rate
- Templates requiring < 20% edits
- < 30 seconds from click to draft

### **Month 3:**
- 70%+ open rate
- 25%+ response rate
- Templates requiring < 5% edits
- $0.005/email cost maintained
- System identifies winning patterns automatically

---

## 🚀 NEXT SESSION: WHERE TO START

### **Recommended Order:**

**Option A: Database First (Recommended)**
```
1. Review PHASE4_PLAN.md database schema
2. Create SQL migration files
3. Run migrations in Supabase
4. Bootstrap voice model from extracted emails
5. Create test clinic for testing
```

**Option B: Generate Templates First (Quick Win)**
```
1. Set up Claude API key
2. Use voice profile to generate 3 templates
3. Review what AI-Mike sounds like
4. Refine prompts if needed
5. Get excited about the system!
```

**Option C: O365 Setup (Infrastructure)**
```
1. Create Azure AD app registration
2. Configure API permissions
3. Get OAuth tokens
4. Test draft creation with simple script
5. Verify it works before building workflow
```

**Option D: Review & Refine**
```
1. Read through PHASE4_PLAN.md thoroughly
2. Ask questions about anything unclear
3. Suggest modifications to the plan
4. Clarify any business requirements
5. Then start implementation
```

---

## 💡 KEY INSIGHTS FROM TODAY

### **1. Template-Based Learning is the Game Changer**
Instead of generating 3 emails per clinic ($0.47 each), we:
- Generate 3 templates once per week ($0.45 total)
- Use same templates for all clinics that week ($0.005 enrichment only)
- Learn which template performs best
- Regenerate next week based on winner
- **Result:** 97% cost reduction + better over time

### **2. Mike's Voice is Distinctive**
The analysis revealed:
- Very consistent sentence structure (16 word avg)
- Specific phrases used repeatedly
- Clear patterns in openings/closings
- **Avoids** typical AI language completely
- This means AI can replicate it well!

### **3. Manual Review is Critical (for now)**
For this project (10-20 emails/day):
- Draft workflow gives full control
- Maintains deliverability (you're the sender)
- Allows learning from every edit
- Builds trust before automation
- **Future bulk project:** Can go full-auto

### **4. Enrichment is the Secret Sauce**
Generic template = ignored
Template + recent clinic news = personalized = responded to
- Perplexity finds info Claude/GPT can't (real-time web)
- Only $0.005 per lookup
- Massive ROI on response rates

### **5. Weekly Optimization Beats Daily**
- Daily: 20 different emails, hard to learn patterns
- Weekly: 3 templates × ~50 uses = clear winner
- Statistical significance
- Easier to identify what works

---

## ❓ OPEN QUESTIONS TO RESOLVE NEXT TIME

1. **SPF/DKIM Setup:**
   - Need to verify current DNS records
   - Add any missing authentication
   - Test with mail-tester.com

2. **Test Clinic:**
   - Should we create a fake clinic with your email?
   - Or use a real clinic but override email to yours?

3. **Template Approval:**
   - Do you want to review/approve generated templates before they go live?
   - Or trust the AI from the start?

4. **Follow-up Strategy:**
   - How many days before follow-up?
   - Different template for follow-ups?

5. **Consultant Templates:**
   - Build these in Week 4?
   - Or start with direct contact only?

---

## 📞 HANDOFF TO NEXT SESSION

**When you come back, say:**

> "Let's pick up where we left off on Phase 4"

**I will:**
1. Read this checkpoint
2. Remember all context
3. Recall all decisions made
4. Know exactly where we are
5. Offer the 4 starting options (A/B/C/D above)

**You left off ready to:**
- Start implementation of Phase 4
- All planning and analysis complete
- All files created and organized
- Clear path forward defined

---

## 📚 KEY DOCUMENTS TO REFERENCE

### **Main Implementation Guide:**
- **`PHASE4_PLAN.md`** (35+ pages, everything you need)

### **Database Design:**
- `PHASE4_PLAN.md` lines 517-750

### **n8n Workflows:**
- `PHASE4_PLAN.md` lines 750-920

### **Dashboard Features:**
- `PHASE4_PLAN.md` lines 920-1080

### **Credentials Setup:**
- `PHASE4_PLAN.md` lines 1085-1199

### **Voice Profile Data:**
- `mike_voice_profile.json`
- `extracted_emails.json`

### **Previous Context:**
- `CHECKPOINT_2025-11-09_END_OF_DAY.md`

---

## 🎉 ACCOMPLISHMENTS TODAY

✅ Tested and verified dashboard is production-ready
✅ Analyzed 10 real emails to learn Mike's authentic voice
✅ Designed cost-effective template system (97% cost reduction)
✅ Created comprehensive 4-week implementation plan
✅ Defined complete database schema (5 tables)
✅ Designed 2 n8n workflows with detailed specs
✅ Identified all required credentials and setup steps
✅ Established success metrics for all phases
✅ Made all key architectural decisions
✅ Created this checkpoint for seamless continuation

**Phase 4 is fully planned and ready to build!** 🚀

---

## 🏁 CURRENT STATUS

- ✅ **Phase 1:** Database schema & Supabase setup (COMPLETE)
- ✅ **Phase 2:** Dashboard foundation (COMPLETE)
- ✅ **Phase 3:** Advanced UI features (COMPLETE)
- ✅ **Phase 3.5:** Visual overhaul, animations, map (COMPLETE)
- 📋 **Phase 4:** n8n outreach workflow (PLANNED, READY TO BUILD)
- ⏸️ **Phase 5:** Testing & production deployment (FUTURE)

---

**Git Status:**
```
Current branch: master

Changes not staged:
- All Phase 4 planning files
- Email analysis files
- Test scripts
- Screenshots

Ready to commit when you're ready to proceed.
```

**Production Dashboard:**
- URL: https://dashboard-cnlhk990t-mike-hyams-projects.vercel.app
- Status: ✅ Live and working
- Last deployment: ~14 hours ago

**n8n Cloud:**
- URL: https://hyamie.app.n8n.cloud
- Status: ✅ Accessible
- Current workflows: 1 (existing data workflow)

---

**Have a safe trip home!** 🏠

When you're ready to continue, just let me know and we'll pick up right where we left off.

---

*Checkpoint created: 2025-11-10 13:45 PM*
*Next session: Phase 4 Implementation*
*Agent: Claude Code*
*Status: Ready to Build* 🚀
