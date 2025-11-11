# Phase 4: Smart Outreach System - Implementation Plan
## Date: November 10, 2025

---

## 🎯 OBJECTIVE

Build an AI-powered email outreach system that:
1. Writes emails in Mike's authentic voice
2. Uses weekly A/B/C template testing to optimize performance
3. Learns from Mike's edits and email performance
4. Costs ~$6/month instead of $188/month
5. Achieves high deliverability and response rates

---

## 📊 MIKE'S VOICE PROFILE (Analyzed from 10 Real Emails)

### **Tone: Conversational-Professional Hybrid**
- Mix of friendly/approachable and businesslike
- Not overly formal but maintains professionalism
- Warm without being excessive

### **Sentence Style:**
- **Average: 16 words per sentence**
- 27.5% short (< 10 words)
- 42.5% medium (10-20 words)
- 30% long (> 20 words)

### **Mike's Signature Patterns:**
✅ **Common Phrases:**
- "I saw" (3x)
- "Let me know" (3x)
- "We can" (5x)
- "Do you have" (2x)
- "If you" (2x)
- "Let us know" (2x)
- "Happy to"
- "Look forward to"

✅ **Opening Style:**
- References recent events: "I saw your 465 posting"
- Gets to point quickly
- Mentions specific details

✅ **Closing Style:**
- Simple: "Thanks,", "Let me know"
- Often offers help: "Let us know if we can help"
- Occasionally casual: "Have a great weekend"

❌ **AVOID (AI Language Not in Mike's Emails):**
- "I hope this email finds you well"
- "Please don't hesitate"
- "At your earliest convenience"
- "Circle back"
- "Touch base"
- "Just reaching out"

### **Subject Line Patterns:**
- Direct and USAC-focused
- Examples: "USAC 465 posting", "USAC Bid", "USAC Telecom"
- Short (3-5 words typically)

---

## 🏗️ SYSTEM ARCHITECTURE

### **Template-Based A/B/C System**

```
MONDAY: Generate 3 Templates
├─ Template A: Professional/Formal tone
├─ Template B: Conversational/Warm tone
└─ Template C: Hybrid/Direct tone

DURING WEEK: Rotate & Track
├─ Clinic 1 → Template A → Enrich → Create Draft → Track
├─ Clinic 2 → Template B → Enrich → Create Draft → Track
├─ Clinic 3 → Template C → Enrich → Create Draft → Track
└─ Continue rotation...

YOUR EDITS: Real-time Learning
├─ You edit Template A before sending
├─ System captures: "User shortened opening line"
├─ Updates Template A immediately for next clinic
└─ Feeds into next week's generation

END OF WEEK: Analyze & Regenerate
├─ Template B: 62% open rate, 22% response ⭐️ Winner!
├─ Generate new templates based on winner + learnings
└─ Continuous improvement cycle
```

---

## 💰 COST BREAKDOWN

### **Per Email:**
- Perplexity AI enrichment: $0.005
- **Total: $0.005 per email**

### **Per Week:**
- Generate 3 templates: $0.45 (one-time)
- **Total weekly: $0.45**

### **Monthly (20 emails/day):**
- Enrichment: 20 × 30 × $0.005 = $3.00
- Templates: 4 weeks × $0.45 = $1.80
- **Total: ~$5/month**

### **Comparison:**
- ❌ Old approach (3 variants per email): $188/month
- ✅ New approach (weekly templates): **$5/month**
- **Savings: 97%** 🎉

---

## 🗄️ DATABASE SCHEMA

### **1. Email Templates (Weekly Versions)**

```sql
CREATE TABLE email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text NOT NULL, -- 'week-45-2025', 'week-46-2025', etc.
    template_variant text CHECK (template_variant IN ('A', 'B', 'C')),

    -- Template type
    contact_type text CHECK (contact_type IN ('direct', 'consultant')),
    tone text CHECK (tone IN ('professional', 'conversational', 'hybrid')),

    -- Template content with placeholders
    subject_template text NOT NULL,
    -- Example: "USAC RHC Support - {{clinic_name}}"

    body_template text NOT NULL,
    -- Example: "{{first_name}},\n\nI saw {{clinic_name}}'s Form 465 for {{funding_year}}.\n\n{{enrichment_context}}\n\nWould you have time this week to discuss how we can help?\n\nThanks,\nMike"

    -- Metadata
    generated_at timestamptz DEFAULT now(),
    generated_by text DEFAULT 'claude-sonnet-3.5',
    generation_cost numeric(10, 4),

    -- Status
    active boolean DEFAULT true,
    retired_at timestamptz,

    -- Performance metrics (aggregated)
    times_used integer DEFAULT 0,
    total_opens integer DEFAULT 0,
    total_clicks integer DEFAULT 0,
    total_responses integer DEFAULT 0,
    avg_open_rate numeric(5, 2),
    avg_response_rate numeric(5, 2),
    quality_score numeric(5, 2),

    -- Constraints
    UNIQUE(version, template_variant, contact_type)
);

CREATE INDEX idx_email_templates_active ON email_templates(active, version);
```

### **2. Email Instances (Each Actual Email)**

```sql
CREATE TABLE email_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid REFERENCES clinics_pending_review(id),
    template_id uuid REFERENCES email_templates(id),

    -- Rendered content (template + enrichment + data)
    subject_rendered text NOT NULL,
    body_rendered text NOT NULL,
    enrichment_data jsonb,
    -- Example: {"source": "perplexity", "context": "Recent expansion to 3 counties...", "confidence": 0.85}

    -- O365 Integration
    draft_id text,
    draft_url text,
    draft_created_at timestamptz,

    -- User edits before sending
    user_edited boolean DEFAULT false,
    original_body text, -- Store original for diff
    edited_body text, -- Store final version
    edit_summary jsonb,
    -- Example: [{"field": "opening", "type": "shortened", "pattern": "removed 'I hope this finds you well'"}]

    -- Tracking
    sent_at timestamptz,
    opened_at timestamptz,
    clicked_at timestamptz,
    responded_at timestamptz,
    response_time_hours integer,

    -- Link back to template performance
    contributed_to_open boolean DEFAULT false,
    contributed_to_response boolean DEFAULT false,

    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_instances_clinic ON email_instances(clinic_id);
CREATE INDEX idx_email_instances_template ON email_instances(template_id);
CREATE INDEX idx_email_instances_sent ON email_instances(sent_at);
```

### **3. Template Edits (Learning from Changes)**

```sql
CREATE TABLE template_edits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES email_templates(id),
    instance_id uuid REFERENCES email_instances(id),

    -- What changed
    field_changed text CHECK (field_changed IN ('subject', 'opening', 'body', 'cta', 'closing', 'enrichment')),
    original_text text,
    edited_text text,
    edit_type text CHECK (edit_type IN ('addition', 'deletion', 'replacement', 'tone_shift', 'shortening')),

    -- When
    edited_at timestamptz DEFAULT now(),

    -- Impact (did this edit help?)
    resulted_in_open boolean,
    resulted_in_response boolean,

    -- Learning
    pattern_identified text,
    -- Example: "User consistently removes 'I hope' openings"
    applied_to_template boolean DEFAULT false
);

CREATE INDEX idx_template_edits_pattern ON template_edits(pattern_identified);
```

### **4. Weekly Performance Reports**

```sql
CREATE TABLE weekly_performance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start date NOT NULL,
    week_end date NOT NULL,

    -- Template performance
    template_a_id uuid REFERENCES email_templates(id),
    template_a_stats jsonb,
    -- Example: {"sent": 45, "opens": 31, "responses": 8, "open_rate": 0.68, "response_rate": 0.18}

    template_b_id uuid REFERENCES email_templates(id),
    template_b_stats jsonb,

    template_c_id uuid REFERENCES email_templates(id),
    template_c_stats jsonb,

    -- Winner
    winning_template text, -- 'A', 'B', or 'C'
    winner_metrics jsonb,

    -- Insights
    key_learnings text[],
    -- Example: ["Shorter subject lines performed 12% better", "Enrichment about recent news increased replies"]

    recommended_changes text[],
    -- Example: ["Keep conversational tone from Template B", "Add more urgency in CTAs"]

    -- Next generation
    next_templates_generated boolean DEFAULT false,
    next_templates_generated_at timestamptz,

    created_at timestamptz DEFAULT now(),

    UNIQUE(week_start)
);
```

### **5. Voice Model (Learned Patterns)**

```sql
CREATE TABLE voice_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version integer NOT NULL,

    -- Learned patterns
    tone_profile jsonb NOT NULL,
    -- Example: {"formality": 0.6, "warmth": 0.8, "directness": 0.9, "professionalism": 0.7}

    preferred_phrases jsonb NOT NULL,
    -- Example: {"openings": ["I saw", "I wanted to"], "transitions": ["We can", "Let me know"], "closings": ["Thanks,", "Looking forward"]}

    avoid_phrases text[] NOT NULL,
    -- Example: ["I hope this email finds you well", "Please don't hesitate", "Circle back"]

    sentence_patterns jsonb NOT NULL,
    -- Example: {"avg_words_per_sentence": 16, "short_pct": 0.28, "medium_pct": 0.42, "long_pct": 0.30}

    example_emails text[],
    -- Mike's original emails used for training

    subject_line_patterns jsonb,
    -- Example: {"avg_length": 4, "uses_clinic_name": true, "uses_usac": true, "direct_format": true}

    -- Metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Confidence
    confidence_score numeric(3, 2),
    training_emails_count integer,

    -- Status
    active boolean DEFAULT true,

    UNIQUE(version)
);

CREATE INDEX idx_voice_model_active ON voice_model(active);
```

---

## 🔄 WORKFLOW DESIGN

### **n8n Workflow: Outreach Email Generation**

**Nodes:**

1. **Webhook Trigger** - "Start Outreach" button clicked
   - Input: `{clinic_id: uuid, user_id: uuid}`

2. **Supabase: Get Clinic Data**
   - Query: Fetch full clinic details
   - Output: clinic object

3. **Function: Determine Contact Type**
   - Logic: Check `has_direct_contact` vs `consultant_needed`
   - Output: `contact_type: 'direct' | 'consultant'`

4. **Supabase: Get Current Template**
   - Query: Get next template in rotation (A → B → C → A...)
   - Filter: `active=true AND version=current_week AND contact_type=determined_type`
   - Output: template object

5. **HTTP Request: Perplexity AI Enrichment**
   ```json
   {
     "url": "https://api.perplexity.ai/chat/completions",
     "method": "POST",
     "body": {
       "model": "llama-3.1-sonar-small-128k-online",
       "messages": [{
         "role": "user",
         "content": "Find recent (last 6 months) information about {{clinic_name}} in {{city}}, {{state}}. Also find information about {{contact_name}} and their role. Focus on: recent expansions, awards, leadership changes, community involvement, healthcare initiatives. Return 2-3 specific, relevant facts for a personalized outreach email. Be concise."
       }]
     }
   }
   ```
   - Cost: $0.005 per request
   - Output: enrichment context

6. **Function: Render Template**
   ```javascript
   // Replace placeholders in template
   const subject = template.subject_template
     .replace('{{clinic_name}}', clinic.clinic_name)
     .replace('{{funding_year}}', clinic.funding_year);

   const body = template.body_template
     .replace('{{first_name}}', clinic.contact_name.split(' ')[0])
     .replace('{{clinic_name}}', clinic.clinic_name)
     .replace('{{funding_year}}', clinic.funding_year)
     .replace('{{enrichment_context}}', enrichment.context)
     .replace('{{city}}', clinic.city)
     .replace('{{state}}', clinic.state);

   return {subject, body};
   ```

7. **HTTP Request: Create O365 Draft**
   ```json
   {
     "url": "https://graph.microsoft.com/v1.0/me/messages",
     "method": "POST",
     "headers": {
       "Authorization": "Bearer {{o365_token}}",
       "Content-Type": "application/json"
     },
     "body": {
       "subject": "{{rendered_subject}}",
       "body": {
         "contentType": "Text",
         "content": "{{rendered_body}}"
       },
       "toRecipients": [{
         "emailAddress": {
           "address": "{{clinic.contact_email}}"
         }
       }]
     }
   }
   ```
   - Output: draft ID and web URL

8. **Supabase: Store Email Instance**
   - Insert into `email_instances` table
   - Update clinic status: `pending_review` → `draft_created`

9. **Supabase: Update Template Usage**
   - Increment `times_used` counter

10. **Respond to Dashboard**
    ```json
    {
      "success": true,
      "draft_url": "https://outlook.office365.com/...",
      "template_variant": "B",
      "instance_id": "uuid",
      "enrichment_preview": "Recent expansion to 3 counties..."
    }
    ```

---

### **n8n Workflow: Weekly Template Generation**

**Schedule: Every Monday at 6 AM**

**Nodes:**

1. **Schedule Trigger** - Cron: `0 6 * * 1`

2. **Supabase: Get Last Week's Performance**
   - Query `weekly_performance` for previous week

3. **Supabase: Get Voice Model**
   - Query `voice_model` WHERE `active=true`

4. **Function: Prepare Generation Prompt**
   ```javascript
   const prompt = `
   Generate 3 email templates for Mike Hyam (USAC RHC consultant).

   MIKE'S VOICE (from analysis of 10 real emails):
   - Tone: Conversational-Professional Hybrid
   - Average sentence: 16 words
   - Common phrases: "I saw", "Let me know", "We can", "Happy to"
   - Opening style: References recent events, gets to point quickly
   - Closing style: Simple ("Thanks,"), offers help
   - AVOID: "I hope this finds you well", "Please don't hesitate", AI jargon

   LAST WEEK'S WINNER: Template ${winner} (${winner_stats})
   KEY LEARNINGS: ${learnings.join(', ')}

   Generate 3 templates with these placeholders:
   - {{clinic_name}}, {{first_name}}, {{funding_year}}
   - {{enrichment_context}} (2-3 sentences from Perplexity)
   - {{city}}, {{state}}

   TEMPLATE A - Professional:
   - Formal but not stuffy
   - Emphasize expertise and track record
   - Subject: Professional, direct

   TEMPLATE B - Conversational:
   - Warm, peer-to-peer tone
   - Build rapport quickly
   - Subject: Friendly, casual

   TEMPLATE C - Hybrid:
   - Balance professionalism with approachability
   - Direct and efficient
   - Subject: Straightforward

   Return JSON:
   {
     "template_a": {"subject": "...", "body": "..."},
     "template_b": {"subject": "...", "body": "..."},
     "template_c": {"subject": "...", "body": "..."}
   }

   Make it sound EXACTLY like Mike would write it naturally.
   `;
   ```

5. **HTTP Request: Claude Sonnet 3.5**
   ```json
   {
     "url": "https://api.anthropic.com/v1/messages",
     "method": "POST",
     "headers": {
       "x-api-key": "{{claude_api_key}}",
       "anthropic-version": "2023-06-01",
       "content-type": "application/json"
     },
     "body": {
       "model": "claude-sonnet-3-5-20241022",
       "max_tokens": 2000,
       "messages": [{
         "role": "user",
         "content": "{{generation_prompt}}"
       }]
     }
   }
   ```
   - Cost: ~$0.15 per generation × 3 = $0.45

6. **Function: Parse Response**
   - Extract template_a, template_b, template_c
   - Validate placeholders exist

7. **Supabase: Store New Templates** (3x)
   - Insert into `email_templates`
   - Set version: `week-{current_week}-2025`
   - Mark as `active=true`

8. **Supabase: Retire Old Templates**
   - Update last week's templates: `active=false`

9. **Slack/Email Notification**
   - Notify Mike: "New weekly templates generated!"
   - Include preview links

---

## 📊 DASHBOARD FEATURES

### **1. Template Management Page**

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Email Templates - Week 45, 2025           [Refresh]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🅰️  Template A - Professional                   [Preview]   │
│      Subject: "USAC RHC Support - {{clinic_name}}"           │
│      Used: 45 times | Opens: 68% | Responses: 18%           │
│      Last updated: Nov 4, 2025                               │
│      [Edit Template] [View Performance] [Deactivate]         │
│                                                               │
│  🅱️  Template B - Conversational ⭐️ Best Performer [Preview] │
│      Subject: "Quick question - {{clinic_name}} Form 465"    │
│      Used: 47 times | Opens: 72% | Responses: 24%           │
│      Last updated: Nov 4, 2025                               │
│      [Edit Template] [View Performance] [Deactivate]         │
│                                                               │
│  🅲  Template C - Hybrid                           [Preview]  │
│      Subject: "USAC RHC - {{clinic_name}}"                   │
│      Used: 43 times | Opens: 65% | Responses: 16%           │
│      Last updated: Nov 4, 2025                               │
│      [Edit Template] [View Performance] [Deactivate]         │
│                                                               │
│  📊 This Week's Performance (135 emails)                      │
│  ├─ Avg Open Rate: 68.3% (↑ 3.2% vs last week)              │
│  ├─ Avg Response Rate: 19.3% (↑ 1.8% vs last week)          │
│  └─ Winner: Template B (+5% response vs others)              │
│                                                               │
│  🧠 Key Learnings This Week                                   │
│  • Shorter subject lines (< 50 chars) perform 12% better    │
│  • "Quick question" opener has 15% higher open rate         │
│  • Enrichment about recent clinic news drives 20% more replies│
│  • Emails sent Tue-Thu get 8% more responses than Mon/Fri   │
│                                                               │
│  [Generate New Templates Now] [View Weekly Report]           │
└─────────────────────────────────────────────────────────────┘
```

### **2. Enhanced Clinic Card (Outreach Section)**

```
┌─────────────────────────────────────────────────────────────┐
│  Honesdale Family Health Center                    FY 2026  │
│  📍 Honesdale, PA 18431                                      │
│  📧 contact@honesdalehealth.org                              │
│  ✅ Has Direct Contact | 🔹 Status: pending_review           │
├─────────────────────────────────────────────────────────────┤
│  📧 OUTREACH STATUS                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🟢 Ready for Outreach                               │    │
│  │ Template: Rotating (Next: Template B)               │    │
│  │ Enrichment: ✅ Available                            │    │
│  │                                                      │    │
│  │ [🚀 Start Outreach] [Preview Email]                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  📜 OUTREACH HISTORY                                         │
│  • Draft created: Nov 10, 2025 10:30 AM                     │
│    Template B | ✏️ You edited (shortened opening)           │
│    Status: Draft in O365 [Open Draft →]                     │
│                                                               │
│  • Previous outreach: Jun 15, 2024                          │
│    Opened: Jun 16 | Response: Jun 17                        │
│    Result: Proposal sent                                     │
│                                                               │
│  [View Full History] [Schedule Follow-up]                    │
└─────────────────────────────────────────────────────────────┘
```

### **3. Email Preview Modal**

```
┌─────────────────────────────────────────────────────────────┐
│  📧 Email Preview - Honesdale Family Health Center    [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Template: B - Conversational  |  Enrichment: ✅ Found      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Subject: Quick question - Honesdale FHC Form 465    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ John,                                                │    │
│  │                                                      │    │
│  │ I saw Honesdale Family Health Center's Form 465    │    │
│  │ for FY 2026.                                        │    │
│  │                                                      │    │
│  │ 🔍 ENRICHMENT:                                      │    │
│  │ I noticed your clinic recently expanded to serve    │    │
│  │ three additional rural counties and received the    │    │
│  │ 2024 Excellence in Rural Care award. Congratulations│    │
│  │ on that recognition.                                 │    │
│  │                                                      │    │
│  │ We specialize in helping RHCs maximize their USAC   │    │
│  │ funding. Do you have time this week to discuss how  │    │
│  │ we can support your filing?                          │    │
│  │                                                      │    │
│  │ Thanks,                                              │    │
│  │ Mike                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  📊 Similar emails using Template B:                         │
│  • Open rate: 72%  |  Response rate: 24%                    │
│  • Avg time to response: 18 hours                            │
│                                                               │
│  [Create Draft in O365] [Edit Before Creating] [Cancel]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 IMPLEMENTATION PHASES

### **Phase 4.1: Foundation (Week 1)**

**Goal: Get end-to-end working with basic template**

1. ✅ Database schema migrations
2. ✅ Bootstrap voice model from Mike's emails
3. ✅ Generate first 3 templates using Claude
4. ✅ Build n8n workflow (webhook → enrichment → O365 draft)
5. ✅ Test with 1 clinic

**Deliverables:**
- Database tables created
- Voice profile stored
- 3 templates active
- Working n8n workflow
- Test email draft created

**Success Criteria:**
- Click "Start Outreach" → Draft appears in O365 within 10 seconds
- Enrichment includes relevant, recent information
- Email sounds like Mike wrote it

---

### **Phase 4.2: Learning System (Week 2)**

**Goal: Track edits and performance**

1. ✅ Build edit tracking webhook
2. ✅ Create diff algorithm to capture changes
3. ✅ Implement template update logic
4. ✅ Add O365 tracking (opens/clicks via Graph API)
5. ✅ Dashboard: Template Management page

**Deliverables:**
- Edit tracking system
- Performance dashboard
- Template Management UI

**Success Criteria:**
- System captures Mike's edits automatically
- Templates update based on patterns
- Dashboard shows real-time performance metrics

---

### **Phase 4.3: Optimization (Week 3)**

**Goal: A/B/C testing and weekly regeneration**

1. ✅ Weekly performance analysis script
2. ✅ Automated template regeneration (Monday 6 AM)
3. ✅ Enhanced dashboard analytics
4. ✅ Email history on clinic cards
5. ✅ Follow-up reminder system

**Deliverables:**
- Weekly reports automated
- Template regeneration working
- Full analytics dashboard

**Success Criteria:**
- Templates improve week over week
- Response rate increases by 10%+
- System runs autonomously

---

### **Phase 4.4: Scale & Polish (Week 4)**

**Goal: Prepare for bulk sending**

1. ✅ Consultant email templates (separate from direct)
2. ✅ Batch processing UI
3. ✅ Email preview improvements
4. ✅ Duplicate prevention logic
5. ✅ Production monitoring

**Deliverables:**
- Both template types working
- Bulk operations ready
- Production-grade monitoring

**Success Criteria:**
- Can handle 20+ emails/day reliably
- Duplicate sends prevented
- System stable and monitored

---

## 🔑 REQUIRED CREDENTIALS & SETUP

### **1. Microsoft O365 Setup**

**Create App Registration:**
1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
   - Name: "USAC RHC Outreach Automation"
   - Supported account types: "Single tenant"
   - Redirect URI: `https://oauth.pstmn.io/v1/callback` (for testing)
4. Note the **Application (client) ID**
5. Go to "Certificates & secrets" → "New client secret"
   - Description: "n8n workflow"
   - Expires: 24 months
   - Note the **Secret value**
6. Go to "API permissions" → "Add a permission" → "Microsoft Graph" → "Delegated permissions"
   - Add: `Mail.ReadWrite`, `Mail.Send`, `User.Read`
7. Click "Grant admin consent"

**Get OAuth Token:**
```bash
# Use Postman or similar to get initial token
POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={client_id}
&client_secret={client_secret}
&scope=https://graph.microsoft.com/.default
&redirect_uri={redirect_uri}
```

**Store in n8n:**
- Client ID
- Client Secret
- Refresh Token

---

### **2. Perplexity AI Setup**

1. Sign up at https://www.perplexity.ai/api
2. Get API key from dashboard
3. Test with:
```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-sonar-small-128k-online",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Store in n8n:**
- API Key

---

### **3. Claude (Anthropic) Setup**

1. Sign up at https://console.anthropic.com
2. Generate API key
3. Test with:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-3-5-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Store in n8n:**
- API Key

---

### **4. Supabase (Already Set Up)**

✅ Already configured from Phase 1-3

**Verify access:**
- URL: `https://fhuqiicgmfpnmficopqp.supabase.co`
- Anon Key: Already in `.env.local`
- Service Role Key: Already in `.env.local`

---

### **5. Domain Authentication (SPF/DKIM)**

**Check current DNS records:**
```bash
dig TXT chargeraccess.com
dig TXT _dmarc.chargeraccess.com
```

**Recommended records:**

**SPF (Sender Policy Framework):**
```
Type: TXT
Host: @
Value: v=spf1 include:spf.protection.outlook.com ~all
TTL: 3600
```

**DKIM (DomainKeys Identified Mail):**
- Set up through O365 admin center
- Go to: https://admin.microsoft.com → Security → Threat management → Policy → DKIM
- Enable DKIM signing for chargeraccess.com
- Add provided CNAME records to DNS

**DMARC (Domain-based Message Authentication):**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@chargeraccess.com; ruf=mailto:dmarc@chargeraccess.com; fo=1
TTL: 3600
```

**Test deliverability:**
- https://www.mail-tester.com
- Send test email to provided address
- Goal: Score 9/10 or higher

---

## 🎯 SUCCESS METRICS

### **Week 1 Targets:**
- ✅ System operational
- ✅ 5 test emails created
- ✅ 0 errors

### **Week 4 Targets:**
- ✅ 100+ emails sent
- 📈 60%+ open rate
- 📈 15%+ response rate
- 🤖 Templates requiring < 20% edits
- ⏱️ < 30 seconds from click to draft

### **Month 3 Targets:**
- 📈 70%+ open rate
- 📈 25%+ response rate
- 🤖 Templates requiring < 5% edits
- 💰 $0.005/email cost maintained
- 🎯 System identifies winning patterns automatically

---

## 🚀 NEXT STEPS

**Ready to start? Here's the recommended order:**

1. **TODAY: Database Setup**
   - Run SQL migrations
   - Bootstrap voice model
   - Create test clinic

2. **DAY 2: Generate First Templates**
   - Run Claude to create A/B/C templates
   - Review and approve
   - Store in database

3. **DAY 3: Build n8n Workflow**
   - Set up O365 credentials
   - Set up Perplexity API
   - Build basic workflow
   - Test with test clinic

4. **DAY 4: Dashboard Integration**
   - Add "Start Outreach" button
   - Display draft URL
   - Show template used

5. **DAY 5: First Real Test**
   - Use on 3 real clinics
   - Track Mike's edits
   - Measure performance

**Then iterate and improve weekly!**

---

## 💡 FUTURE ENHANCEMENTS (Phase 5+)

1. **SendGrid Integration** - For bulk automated sending
2. **Multi-variant Subject Testing** - Test 3 subjects per template
3. **Time Optimization** - Find best send times per recipient
4. **Response Classification** - Auto-categorize responses
5. **Follow-up Sequences** - Automated follow-ups after N days
6. **CRM Integration** - Sync with customer relationship tools
7. **Voice Cloning** - Advanced: Match tone even more precisely
8. **Predictive Analytics** - Predict response likelihood before sending

---

**Document Version:** 1.0
**Created:** November 10, 2025
**Author:** Claude Code with Mike Hyams
**Status:** Ready for Implementation
