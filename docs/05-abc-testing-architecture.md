# A/B/C Email Testing Architecture

## Overview
This document outlines the complete architecture for A/B/C testing email templates with human-in-the-loop approval, performance tracking, and automated optimization.

---

## 1. Architecture Recommendations

### Storage Strategy: **Hybrid Database + n8n Approach**

**Database (Supabase PostgreSQL):**
- Template metadata, versioning, and performance metrics
- Email instances with tracking data
- Manual clinic groupings
- Human edits and approval queue

**n8n:**
- Template selection logic
- Email generation with AI
- Outlook Draft API integration
- Weekly performance analysis workflow

**Why Hybrid?**
- Database provides structured querying, reporting, and historical tracking
- n8n handles workflow orchestration and AI integration
- Separation of concerns: data persistence vs. business logic
- Easy to add new template variants without code changes

---

## 2. Database Schema Extensions

### New Tables

```sql
-- ============================================================================
-- Email Templates
-- Stores template variants with A/B/C testing metadata
-- ============================================================================
CREATE TABLE public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Template identification
  template_name TEXT NOT NULL, -- e.g., "Direct Contact - High Value"
  template_variant CHAR(1) NOT NULL CHECK (template_variant IN ('A', 'B', 'C')),
  category TEXT NOT NULL CHECK (category IN ('direct_contact', 'consultant')),
  funding_threshold TEXT NOT NULL CHECK (funding_threshold IN ('under_threshold', 'over_threshold')),

  -- Versioning (weekly iterations)
  version TEXT NOT NULL, -- e.g., "week-46-2025"
  active BOOLEAN DEFAULT true,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,

  -- Template content
  subject_line TEXT NOT NULL,
  body_template TEXT NOT NULL, -- Supports {{variables}}

  -- RFP best practices fields
  opening_line TEXT, -- Personalized greeting
  value_proposition TEXT, -- How we help
  credibility_statement TEXT, -- Past experience/results
  call_to_action TEXT, -- Next steps

  -- Performance tracking
  times_used INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  total_human_edits INTEGER DEFAULT 0,
  avg_open_rate DECIMAL(5,2),
  avg_response_rate DECIMAL(5,2),

  -- Human feedback
  human_edit_patterns JSONB, -- Common edits made
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite unique constraint: only one active variant per category+threshold+version
CREATE UNIQUE INDEX email_templates_active_variant_idx
ON public.email_templates(category, funding_threshold, template_variant, version)
WHERE active = true;

-- ============================================================================
-- Email Instances
-- Tracks every email generated with metrics
-- ============================================================================
CREATE TABLE public.email_instances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- References
  clinic_id UUID NOT NULL REFERENCES public.clinics_pending_review(id),
  template_id UUID NOT NULL REFERENCES public.email_templates(id),
  user_id TEXT NOT NULL,

  -- Email details
  template_variant CHAR(1) NOT NULL,
  recipient_email TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  body_content TEXT NOT NULL,

  -- Outlook integration
  outlook_draft_id TEXT,
  outlook_draft_url TEXT,

  -- Human modifications
  was_edited BOOLEAN DEFAULT false,
  edit_summary TEXT,
  original_subject TEXT,
  original_body TEXT,

  -- Performance tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance queries
CREATE INDEX email_instances_clinic_idx ON public.email_instances(clinic_id);
CREATE INDEX email_instances_template_idx ON public.email_instances(template_id);
CREATE INDEX email_instances_created_idx ON public.email_instances(created_at DESC);
CREATE INDEX email_instances_sent_idx ON public.email_instances(sent_at DESC) WHERE sent_at IS NOT NULL;

-- ============================================================================
-- Manual Clinic Groups
-- Allows grouping multiple HCP numbers under one clinic identity
-- ============================================================================
CREATE TABLE public.clinic_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Group metadata
  group_name TEXT NOT NULL,
  primary_clinic_id UUID REFERENCES public.clinics_pending_review(id),

  -- Aggregated data (computed)
  total_funding_amount DECIMAL(12,2),
  location_count INTEGER,

  -- User tracking
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Clinic Group Members
-- Junction table for many-to-many relationship
-- ============================================================================
CREATE TABLE public.clinic_group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  group_id UUID NOT NULL REFERENCES public.clinic_groups(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics_pending_review(id) ON DELETE CASCADE,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, clinic_id)
);

CREATE INDEX clinic_group_members_group_idx ON public.clinic_group_members(group_id);
CREATE INDEX clinic_group_members_clinic_idx ON public.clinic_group_members(clinic_id);

-- ============================================================================
-- Template Approval Queue
-- Manages human approval for AI-suggested template improvements
-- ============================================================================
CREATE TABLE public.template_approval_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Reference to base template being improved
  base_template_id UUID REFERENCES public.email_templates(id),

  -- Proposed changes
  proposed_variant CHAR(1) NOT NULL,
  proposed_subject TEXT NOT NULL,
  proposed_body TEXT NOT NULL,

  -- AI analysis
  change_rationale TEXT, -- Why AI suggests this change
  based_on_edits JSONB, -- Sample human edits that informed this
  expected_improvement TEXT, -- "15% better open rate based on..."

  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX template_approval_status_idx ON public.template_approval_queue(status, created_at DESC);
```

### Extend Existing Table

```sql
-- Add new columns to clinics_pending_review
ALTER TABLE public.clinics_pending_review
ADD COLUMN contact_is_consultant BOOLEAN DEFAULT false,
ADD COLUMN mail_contact_is_consultant BOOLEAN DEFAULT false,
ADD COLUMN mail_contact_first_name TEXT,
ADD COLUMN mail_contact_last_name TEXT,
ADD COLUMN mail_contact_email TEXT,
ADD COLUMN mail_contact_phone TEXT,
ADD COLUMN funding_year_breakdown JSONB, -- {"FY2025": 15360, "FY2026": 15360}
ADD COLUMN request_for_services TEXT, -- Already exists per handoff
ADD COLUMN outreach_status TEXT DEFAULT 'pending' CHECK (
  outreach_status IN ('pending', 'ready_for_outreach', 'outreach_sent', 'awaiting_response', 'follow_up_needed', 'responded', 'completed')
),
ADD COLUMN last_outreach_sent_at TIMESTAMPTZ,
ADD COLUMN follow_up_due_date TIMESTAMPTZ,
ADD COLUMN belongs_to_group_id UUID REFERENCES public.clinic_groups(id);

-- Index for follow-up tracking
CREATE INDEX clinics_outreach_status_idx ON public.clinics_pending_review(outreach_status);
CREATE INDEX clinics_follow_up_due_idx ON public.clinics_pending_review(follow_up_due_date) WHERE follow_up_due_date IS NOT NULL;
CREATE INDEX clinics_awaiting_response_idx ON public.clinics_pending_review(outreach_status, last_outreach_sent_at) WHERE outreach_status = 'awaiting_response';
```

---

## 3. Template Categories & Variants

### Category Matrix

| Category | Funding Threshold | Template Variant | Target Scenario |
|----------|------------------|------------------|-----------------|
| Direct Contact | Under Threshold | A, B, C | Small clinics, direct decision-makers |
| Direct Contact | Over Threshold | A, B, C | Large clinics, direct decision-makers |
| Consultant | Under Threshold | A, B, C | Small clinics via consultant |
| Consultant | Over Threshold | A, B, C | Large clinics via consultant |
| Follow-Up | Any | A, B, C | No response after 7 days |

**Total: 15 template variants** (5 categories × 3 variants)

### Funding Thresholds (Recommended)
- **Under Threshold:** < $50,000 total 3-year funding
- **Over Threshold:** ≥ $50,000 total 3-year funding

**Rationale:** Higher-value opportunities justify more detailed proposals and relationship-building

---

## 4. RFP Best Practices Integration

Based on research, every template should include:

### 1. **Professional Subject Line**
- ✅ Clear and specific: "Re: [Service Type] RFP - [HCP Number]"
- ✅ Easily identifiable in inbox
- ✅ Professional tone

### 2. **Personalized Opening**
- Address by name (or title if name unknown)
- Reference their specific RFP/Form 465 filing
- Thank them for the opportunity

### 3. **Understanding Confirmation**
- Summarize their needs (service type, bandwidth, locations)
- Show you've read their RFP thoroughly

### 4. **Value Proposition**
- How you specifically address their requirements
- Relevant experience with similar healthcare facilities
- Understanding of USAC RHC program requirements

### 5. **Credibility Statement**
- Brief case study or example
- Years of experience
- Number of clinics served

### 6. **Clear Next Steps**
- Specific call-to-action
- Timeline for proposal
- Contact information for questions

### 7. **Professional Close**
- Reiterate interest
- Availability for follow-up
- Professional signature

---

## 5. Template Selection Modal (UI Component)

### Modal Design: "Begin Outreach"

When user clicks "Start Outreach" button:

```
┌─────────────────────────────────────────────────────────┐
│  Select Outreach Template                          [X]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Clinic: Mountain View Health Center                 │
│  💰 3-Year Funding: $76,500                             │
│  👤 Contact: Direct (John Smith, CEO)                   │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Choose Template Method:                                │
│                                                          │
│  ○ Auto Template (AI Recommended)                       │
│     Template B - "Direct Contact - High Value"          │
│     📈 Best performer: 42% open rate, 18% response      │
│                                                          │
│  ○ AI with Sorry (Experimental)                         │
│     Let AI generate custom approach with human review   │
│     ⚠️ Will require manual approval before sending      │
│                                                          │
│  ○ Manual Template Selection                            │
│     Choose specific variant:                            │
│     [ ] Template A (Professional & Concise)             │
│     [ ] Template B (Detailed Value Prop) ⭐ Top         │
│     [ ] Template C (Consultative Approach)              │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  [Preview Template]      [Cancel]    [Generate Draft]   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### "AI with Sorry" Note
I believe "Allow Sorry" was a typo for "AI Story" or similar. I'm interpreting this as:
- **AI-Generated Custom:** Let AI create a fully custom email based on specific clinic details
- Requires human review before sending (appears in approval queue)
- Experimental feature for high-value opportunities

---

## 6. Workflow Architecture

### 6.1 Email Generation Flow

```
User clicks "Start Outreach"
        ↓
Template Selection Modal appears
        ↓
User selects: Auto / AI Custom / Manual
        ↓
    [AUTO PATH]
        ↓
n8n: Fetch clinic data from Supabase
        ↓
n8n: Determine category (direct/consultant, threshold)
        ↓
n8n: Query active templates for this week
        ↓
n8n: Select variant using round-robin or weighted random
        ↓
n8n: Populate template variables
        ↓
n8n: Create Outlook draft via Microsoft Graph API
        ↓
n8n: Save email_instance to database
        ↓
n8n: Update clinic outreach_status
        ↓
Return draft_url to frontend
        ↓
Frontend: Open draft in new tab + show toast notification
```

### 6.2 Weekly Analysis Flow

```
Every Sunday at 11:59 PM
        ↓
n8n: Query email_instances from past week
        ↓
n8n: Group by template_id and variant
        ↓
n8n: Calculate metrics:
    - Times used
    - Open rate
    - Response rate
    - Human edit frequency
        ↓
n8n: Update email_templates performance fields
        ↓
n8n: Analyze human edits (JSONB patterns)
        ↓
n8n: Identify common modifications:
    - Subject line changes
    - Opening paragraph tweaks
    - Call-to-action adjustments
        ↓
n8n: Generate AI-suggested improvements
        ↓
n8n: Create template_approval_queue entries
        ↓
n8n: Send notification to admin:
    "5 template improvements ready for review"
        ↓
Admin reviews in dashboard approval UI
        ↓
If approved → Create new week templates
```

### 6.3 Human Approval Workflow

```
Admin navigates to "Template Manager" page
        ↓
Views pending approvals in queue
        ↓
For each suggestion:
    - See current template vs. proposed
    - View AI rationale
    - Review sample human edits that informed change
    - See expected improvement percentage
        ↓
Admin decision:
    ✅ Approve → Create new active template for next week
    ❌ Reject → Mark as rejected, template unchanged
    ✏️ Edit → Modify AI suggestion, then approve
        ↓
System creates version "week-47-2025" with approved changes
        ↓
Old templates remain active=false for historical tracking
```

---

## 7. Multi-Select Clinic Grouping (Bonus Feature)

### UI Implementation

**ClinicCard modifications:**
```tsx
// Add checkbox to top-left of each card
<Checkbox
  checked={isSelected}
  onCheckedChange={(checked) => onSelectClinic(clinic.id, checked)}
/>
```

**New Toolbar when ≥2 selected:**
```
┌─────────────────────────────────────────────────────────┐
│  5 clinics selected                                      │
│  Total Funding: $182,450                                │
│                                                          │
│  [Group Selected Clinics]  [Clear Selection]            │
└─────────────────────────────────────────────────────────┘
```

**Group Creation Modal:**
```
┌─────────────────────────────────────────────────────────┐
│  Create Clinic Group                               [X]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Group Name: ___________________________________        │
│               (e.g., "Regional Medical Group")          │
│                                                          │
│  Selected Clinics:                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │ ✓ Regional Medical - Main Campus               │    │
│  │   HCP 27206 | $45,000                          │    │
│  │                                                 │    │
│  │ ✓ Regional Medical - North Clinic              │    │
│  │   HCP 28150 | $38,200                          │    │
│  │                                                 │    │
│  │ ✓ Regional Medical - South Clinic              │    │
│  │   HCP 29033 | $52,100                          │    │
│  │                                                 │    │
│  │ ✓ Regional Medical - East Campus               │    │
│  │   HCP 27890 | $47,150                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Primary Contact: [Dropdown: Select clinic for contact] │
│                                                          │
│  📊 Total Group Funding: $182,450                       │
│  📍 Total Locations: 4                                  │
│                                                          │
│  [Cancel]                        [Create Group]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Database Operations

1. **Create Group:**
```sql
INSERT INTO clinic_groups (group_name, primary_clinic_id, created_by)
VALUES ('Regional Medical Group', 'uuid-of-primary', 'user-id')
RETURNING id;
```

2. **Add Members:**
```sql
INSERT INTO clinic_group_members (group_id, clinic_id)
VALUES
  ('group-uuid', 'clinic-1-uuid'),
  ('group-uuid', 'clinic-2-uuid'),
  ('group-uuid', 'clinic-3-uuid'),
  ('group-uuid', 'clinic-4-uuid');
```

3. **Update Clinics:**
```sql
UPDATE clinics_pending_review
SET belongs_to_group_id = 'group-uuid'
WHERE id IN ('clinic-1-uuid', 'clinic-2-uuid', ...);
```

4. **Display Grouped Card:**
- Show one card for the group
- Badge: "4 Locations"
- Summed funding by fiscal year
- Dropdown showing all member clinics with individual details

---

## 8. Follow-Up Tracking Dashboard

### New Page: "Awaiting Response"

**URL:** `/dashboard/outreach/follow-ups`

**Filter Options:**
- Days since outreach: 7+, 14+, 30+
- Funding amount: High to Low
- Service type
- State

**Table Columns:**
| Clinic Name | HCP | Funding | Sent Date | Days Ago | Template | Last Status | Actions |
|-------------|-----|---------|-----------|----------|----------|-------------|---------|
| Mountain View | 27206 | $76,500 | Nov 10 | 7 days | B | Awaiting Response | [Send Follow-Up] |

**Automatic Follow-Up Scheduling:**
```sql
-- Trigger to set follow_up_due_date
CREATE OR REPLACE FUNCTION set_follow_up_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outreach_status = 'awaiting_response' AND NEW.last_outreach_sent_at IS NOT NULL THEN
    NEW.follow_up_due_date = NEW.last_outreach_sent_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_follow_up
  BEFORE UPDATE ON clinics_pending_review
  FOR EACH ROW
  EXECUTE FUNCTION set_follow_up_date();
```

---

## 9. Implementation Phases

### Phase 1: Database Foundation (Week 1)
- [ ] Create new tables (email_templates, email_instances, etc.)
- [ ] Extend clinics_pending_review with consultant flags
- [ ] Create initial seed templates (A/B/C for each category)
- [ ] Test queries and indexes

### Phase 2: Template Selection UI (Week 1-2)
- [ ] Build Template Selection Modal component
- [ ] Integrate with existing OutreachButton
- [ ] Add template preview functionality
- [ ] Connect to n8n webhook with template selection

### Phase 3: n8n Workflow Updates (Week 2)
- [ ] Modify email generation workflow to accept template_id
- [ ] Add template selection logic (auto/manual/AI)
- [ ] Implement round-robin variant assignment
- [ ] Save email_instances with performance tracking

### Phase 4: Performance Tracking (Week 2-3)
- [ ] Build Template Performance Dashboard
- [ ] Create weekly analysis n8n workflow
- [ ] Implement human edit pattern detection
- [ ] Build approval queue UI

### Phase 5: Follow-Up System (Week 3)
- [ ] Create Follow-Up Tracking page
- [ ] Implement automatic due date calculations
- [ ] Add follow-up email templates
- [ ] Build notification system

### Phase 6: Clinic Grouping (Week 3-4)
- [ ] Add multi-select to ClinicCard
- [ ] Build Group Creation Modal
- [ ] Implement group aggregation logic
- [ ] Update ClinicList to show grouped cards

### Phase 7: Human Approval Loop (Week 4)
- [ ] Build Template Approval Queue UI
- [ ] Create AI improvement suggestion logic
- [ ] Implement version management
- [ ] Add admin notification system

---

## 10. Technical Recommendations

### Frontend (Next.js)
- **State Management:** React Context for selected clinics, Zustand for complex state
- **UI Components:** Radix UI primitives (already in use)
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table for sortable/filterable lists

### Backend (Supabase)
- **Real-time subscriptions:** Use for live metrics updates
- **Edge Functions:** For complex calculations (if needed)
- **Storage:** For template attachments/screenshots

### n8n Workflows
- **Error Handling:** Implement retry logic with exponential backoff
- **Logging:** Store workflow execution logs in system_alerts
- **Testing:** Use n8n's testing mode before deploying to production

### Microsoft Graph API
- **Draft Creation:** POST /me/messages with saveToSentItems=false
- **Tracking:** Consider using Outlook message IDs for open tracking
- **Permissions:** Requires Mail.ReadWrite delegated permission

---

## Summary

This architecture provides:

✅ **Scalable A/B/C testing** with database-driven template management
✅ **Human-in-the-loop approval** for continuous improvement
✅ **Automated performance tracking** with weekly analysis
✅ **Flexible template selection** (Auto/AI/Manual)
✅ **Follow-up management** to prevent leads from going cold
✅ **Manual clinic grouping** for multi-location organizations
✅ **RFP best practices** integrated into all templates

**Next Steps:**
1. Review and approve this architecture
2. Clarify "Allow Sorry" → AI Custom feature
3. Set funding threshold amount
4. Begin Phase 1 implementation
