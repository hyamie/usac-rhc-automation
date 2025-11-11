# n8n Workflow: Outreach Email Generation
## Specification for Phase 4.2

---

## Overview

**Purpose:** Generate personalized email drafts for USAC RHC clinics using template-based A/B/C system with AI enrichment

**Trigger:** Webhook from dashboard "Start Outreach" button
**Duration:** < 10 seconds from trigger to draft creation
**Cost per execution:** $0.005 (Perplexity enrichment only)

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  OUTREACH EMAIL GENERATION                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Webhook Trigger                                          │
│     ↓ {clinic_id, user_id}                                  │
│                                                               │
│  2. Supabase: Get Clinic                                     │
│     ↓ {clinic data, contact info}                           │
│                                                               │
│  3. Function: Determine Contact Type                         │
│     ↓ {contact_type: 'direct' | 'consultant'}              │
│                                                               │
│  4. Supabase: Get Template (Rotating A→B→C)                 │
│     ↓ {template_variant, subject_template, body_template}   │
│                                                               │
│  5. HTTP: Perplexity AI Enrichment ($0.005)                 │
│     ↓ {enrichment_context}                                   │
│                                                               │
│  6. Function: Render Template                                │
│     ↓ {rendered_subject, rendered_body}                      │
│                                                               │
│  7. HTTP: Create O365 Draft                                  │
│     ↓ {draft_id, draft_url}                                  │
│                                                               │
│  8. Supabase: Store Email Instance                           │
│     ↓ {instance_id}                                          │
│                                                               │
│  9. Supabase: Update Template Usage                          │
│     ↓                                                         │
│                                                               │
│ 10. Respond to Dashboard                                     │
│     ↓ {success, draft_url, template_variant, preview}       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Node Specifications

### Node 1: Webhook Trigger

**Type:** Webhook
**Name:** "Trigger: Dashboard Start Outreach"

**Settings:**
- HTTP Method: POST
- Path: `/webhook/outreach-email`
- Authentication: Header Auth
- Header Name: `X-Webhook-Token`
- Response Mode: Return Last Node

**Expected Input:**
```json
{
  "clinic_id": "uuid",
  "user_id": "uuid"
}
```

**Output:**
```json
{
  "body": {
    "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000"
  },
  "headers": {
    "x-webhook-token": "your-secret-token"
  }
}
```

---

### Node 2: Supabase - Get Clinic Data

**Type:** Supabase
**Name:** "Get Clinic Details"

**Operation:** Select Rows

**Settings:**
- Table: `clinics`
- Filters:
  - Field: `id`
  - Operator: `equals`
  - Value: `{{ $json.body.clinic_id }}`
- Return All: false (single row)

**Fields to Return:**
```
id, clinic_name, city, state, funding_year,
contact_name, contact_email, contact_phone,
has_direct_contact, consultant_needed,
status, form_465_date
```

**Output:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clinic_name": "Honesdale Family Health Center",
  "city": "Honesdale",
  "state": "PA",
  "funding_year": "FY 2026",
  "contact_name": "John Smith",
  "contact_email": "john.smith@honesdalehealth.org",
  "contact_phone": "(570) 253-8616",
  "has_direct_contact": true,
  "consultant_needed": false,
  "status": "pending_review",
  "form_465_date": "2025-03-15"
}
```

---

### Node 3: Function - Determine Contact Type

**Type:** Code (JavaScript)
**Name:** "Determine Contact Type"

**Code:**
```javascript
// Determine if this is direct contact or needs consultant outreach
const clinic = $input.item.json;

const contactType = clinic.has_direct_contact ? 'direct' : 'consultant';

// Also calculate week number for template version
const today = new Date();
const startOfYear = new Date(today.getFullYear(), 0, 1);
const days = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
const weekVersion = `week-${weekNumber}-${today.getFullYear()}`;

return {
  ...clinic,
  contact_type: contactType,
  week_version: weekVersion,
  generated_at: new Date().toISOString()
};
```

**Output:**
```json
{
  ...clinic_data,
  "contact_type": "direct",
  "week_version": "week-46-2025",
  "generated_at": "2025-11-11T16:30:00Z"
}
```

---

### Node 4: Supabase - Get Current Template

**Type:** Supabase
**Name:** "Get Template (Rotating A/B/C)"

**Operation:** Select Rows

**Settings:**
- Table: `email_templates`
- Filters:
  - Field: `active`, Operator: `equals`, Value: `true`
  - Field: `version`, Operator: `equals`, Value: `{{ $json.week_version }}`
  - Field: `contact_type`, Operator: `equals`, Value: `{{ $json.contact_type }}`
- Sort Field: `times_used`
- Sort Direction: ASC
- Limit: 1

**Logic:** Sorts by `times_used` ascending, so the template that's been used least gets selected next (automatic rotation)

**Output:**
```json
{
  "id": "template-uuid",
  "version": "week-46-2025",
  "template_variant": "B",
  "contact_type": "direct",
  "tone": "conversational",
  "subject_template": "Quick question - {{clinic_name}} Form 465",
  "body_template": "{{first_name}},\n\nI saw you filed a Form 465...",
  "times_used": 12,
  "active": true
}
```

---

### Node 5: HTTP Request - Perplexity AI Enrichment

**Type:** HTTP Request
**Name:** "Perplexity: Enrich Context"

**Method:** POST
**URL:** `https://api.perplexity.ai/chat/completions`

**Headers:**
```json
{
  "Authorization": "Bearer {{ $credentials.perplexity.apiKey }}",
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "model": "llama-3.1-sonar-small-128k-online",
  "messages": [
    {
      "role": "user",
      "content": "Find recent (last 6 months) information about {{ $('Get Clinic Details').item.json.clinic_name }} in {{ $('Get Clinic Details').item.json.city }}, {{ $('Get Clinic Details').item.json.state }}. Also find information about {{ $('Get Clinic Details').item.json.contact_name }} and their role. Focus on: recent expansions, awards, leadership changes, community involvement, healthcare initiatives. Return 2-3 specific, relevant facts for a personalized outreach email. Be concise."
    }
  ],
  "temperature": 0.3,
  "max_tokens": 200
}
```

**Response Options:**
- Response Format: JSON
- Extract: `choices[0].message.content`

**Cost:** ~$0.005 per request

**Output:**
```json
{
  "enrichment_context": "Honesdale Family Health Center recently expanded to serve three additional rural counties and received the 2024 Excellence in Rural Care award from the Pennsylvania Healthcare Association.",
  "enrichment_source": "perplexity",
  "enrichment_cost": 0.005,
  "enrichment_tokens": 45
}
```

---

### Node 6: Function - Render Template

**Type:** Code (JavaScript)
**Name:** "Render Template with Data"

**Code:**
```javascript
// Get data from previous nodes
const clinic = $('Get Clinic Details').item.json;
const template = $('Get Template (Rotating A/B/C)').item.json;
const enrichment = $input.item.json;

// Extract first name from full name
const firstName = clinic.contact_name.split(' ')[0];

// Signature
const signature = `Mike Hyams
Charger Access, LLC
615-622-4603 Office
206 Gothic Ct, Suite 304
Franklin, TN 37067
www.chargeraccess.com`;

// Replace all placeholders in subject
let renderedSubject = template.subject_template
  .replace(/\{\{clinic_name\}\}/g, clinic.clinic_name)
  .replace(/\{\{funding_year\}\}/g, clinic.funding_year)
  .replace(/\{\{city\}\}/g, clinic.city)
  .replace(/\{\{state\}\}/g, clinic.state);

// Replace all placeholders in body
let renderedBody = template.body_template
  .replace(/\{\{first_name\}\}/g, firstName)
  .replace(/\{\{clinic_name\}\}/g, clinic.clinic_name)
  .replace(/\{\{funding_year\}\}/g, clinic.funding_year)
  .replace(/\{\{enrichment_context\}\}/g, enrichment.enrichment_context)
  .replace(/\{\{city\}\}/g, clinic.city)
  .replace(/\{\{state\}\}/g, clinic.state)
  .replace(/\{\{signature\}\}/g, signature);

return {
  clinic_id: clinic.id,
  template_id: template.id,
  template_variant: template.template_variant,
  subject_rendered: renderedSubject,
  body_rendered: renderedBody,
  enrichment_data: {
    source: "perplexity",
    context: enrichment.enrichment_context,
    cost: enrichment.enrichment_cost
  },
  recipient_email: clinic.contact_email,
  recipient_name: clinic.contact_name
};
```

**Output:**
```json
{
  "clinic_id": "uuid",
  "template_id": "template-uuid",
  "template_variant": "B",
  "subject_rendered": "Quick question - Honesdale Family Health Center Form 465",
  "body_rendered": "John,\n\nI saw you filed a Form 465 for FY 2026...",
  "enrichment_data": {
    "source": "perplexity",
    "context": "Honesdale Family Health Center recently expanded...",
    "cost": 0.005
  },
  "recipient_email": "john.smith@honesdalehealth.org",
  "recipient_name": "John Smith"
}
```

---

### Node 7: HTTP Request - Create O365 Draft

**Type:** HTTP Request
**Name:** "O365: Create Email Draft"

**Method:** POST
**URL:** `https://graph.microsoft.com/v1.0/me/messages`

**Authentication:** OAuth2
**Credential Type:** Microsoft OAuth2 API

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "subject": "{{ $json.subject_rendered }}",
  "importance": "Normal",
  "body": {
    "contentType": "Text",
    "content": "{{ $json.body_rendered }}"
  },
  "toRecipients": [
    {
      "emailAddress": {
        "address": "{{ $json.recipient_email }}",
        "name": "{{ $json.recipient_name }}"
      }
    }
  ]
}
```

**Response Options:**
- Response Format: JSON
- Full Response

**Output:**
```json
{
  "id": "AAMkAGE...",
  "subject": "Quick question - Honesdale FHC Form 465",
  "isDraft": true,
  "webLink": "https://outlook.office365.com/owa/?ItemID=AAMkAGE...",
  "createdDateTime": "2025-11-11T16:30:45Z"
}
```

---

### Node 8: Supabase - Store Email Instance

**Type:** Supabase
**Name:** "Store Email Instance"

**Operation:** Insert

**Table:** `email_instances`

**Settings:**
- Insert Mode: Insert Single Row

**Data to Insert:**
```json
{
  "clinic_id": "{{ $('Render Template with Data').item.json.clinic_id }}",
  "template_id": "{{ $('Render Template with Data').item.json.template_id }}",
  "subject_rendered": "{{ $('Render Template with Data').item.json.subject_rendered }}",
  "body_rendered": "{{ $('Render Template with Data').item.json.body_rendered }}",
  "enrichment_data": "{{ $('Render Template with Data').item.json.enrichment_data }}",
  "draft_id": "{{ $('O365: Create Email Draft').item.json.id }}",
  "draft_url": "{{ $('O365: Create Email Draft').item.json.webLink }}",
  "draft_created_at": "{{ $('O365: Create Email Draft').item.json.createdDateTime }}",
  "original_body": "{{ $('Render Template with Data').item.json.body_rendered }}"
}
```

**Output:**
```json
{
  "id": "instance-uuid",
  "clinic_id": "clinic-uuid",
  "template_id": "template-uuid",
  "created_at": "2025-11-11T16:30:46Z"
}
```

---

### Node 9: Supabase - Update Template Usage

**Type:** Supabase
**Name:** "Increment Template Usage"

**Operation:** Update

**Table:** `email_templates`

**Settings:**
- Update Mode: Update by ID
- ID: `{{ $('Get Template (Rotating A/B/C)').item.json.id }}`

**Data to Update:**
```json
{
  "times_used": "={{ $('Get Template (Rotating A/B/C)').item.json.times_used + 1 }}"
}
```

**Output:**
```json
{
  "id": "template-uuid",
  "times_used": 13
}
```

---

### Node 10: Respond to Dashboard

**Type:** Respond to Webhook
**Name:** "Return Success to Dashboard"

**Response:**
```json
{
  "success": true,
  "draft_url": "{{ $('O365: Create Email Draft').item.json.webLink }}",
  "draft_id": "{{ $('O365: Create Email Draft').item.json.id }}",
  "template_variant": "{{ $('Render Template with Data').item.json.template_variant }}",
  "instance_id": "{{ $('Store Email Instance').item.json.id }}",
  "enrichment_preview": "{{ $('Render Template with Data').item.json.enrichment_data.context.substring(0, 100) }}...",
  "subject": "{{ $('Render Template with Data').item.json.subject_rendered }}",
  "generated_at": "{{ new Date().toISOString() }}"
}
```

---

## Error Handling

### Node: Catch Errors (Between Each Node)

**Type:** Error Trigger
**Name:** "Handle Errors"

Add error handling after critical nodes:

**After Supabase Get Clinic:**
- Error: Clinic not found
- Action: Return 404 with message

**After Perplexity:**
- Error: API failure or timeout
- Action: Use fallback enrichment or skip

**After O365:**
- Error: Authentication failed or API error
- Action: Return error, don't store instance

**Generic Error Handler:**
```json
{
  "success": false,
  "error": "{{ $json.error.message }}",
  "error_node": "{{ $json.error.node }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## Credentials Required

### 1. Supabase
**Name:** `USAC Supabase`
**Type:** Supabase API
**Fields:**
- Host: `fhuqiicgmfpnmficopqp.supabase.co`
- Service Role Key: [From .env.local]

### 2. Perplexity AI
**Name:** `Perplexity API`
**Type:** Header Auth
**Fields:**
- Name: `Authorization`
- Value: `Bearer [API_KEY]`

### 3. Microsoft O365
**Name:** `O365 Mike Hyams`
**Type:** Microsoft OAuth2 API
**Scopes Required:**
- `Mail.ReadWrite`
- `Mail.Send`
- `User.Read`

### 4. Webhook Authentication
**Name:** `Dashboard Webhook Token`
**Type:** Header Auth
**Fields:**
- Name: `X-Webhook-Token`
- Value: [Generate secure token]

---

## Testing Strategy

### Test 1: Minimal Valid Request
```bash
curl -X POST https://hyamie.app.n8n.cloud/webhook/outreach-email \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: YOUR_TOKEN" \
  -d '{
    "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "draft_url": "https://outlook.office365.com/owa/?ItemID=...",
  "template_variant": "B",
  "instance_id": "uuid",
  "enrichment_preview": "Recent expansion to 3 counties...",
  "subject": "Quick question - Honesdale FHC Form 465",
  "generated_at": "2025-11-11T16:30:47Z"
}
```

### Test 2: Verify Database Records
```sql
-- Check email instance was stored
SELECT * FROM email_instances ORDER BY created_at DESC LIMIT 1;

-- Check template usage incremented
SELECT template_variant, times_used
FROM email_templates
WHERE version = 'week-46-2025' AND active = true;
```

### Test 3: Check Draft in Outlook
1. Open Outlook Web: https://outlook.office365.com
2. Navigate to Drafts folder
3. Find draft with subject matching test
4. Verify enrichment context is included
5. Verify email sounds like Mike

---

## Performance Targets

- **Total Execution Time:** < 10 seconds
- **Webhook → Response:** < 10s
- **Perplexity API:** < 3s
- **O365 Draft Creation:** < 2s
- **Database Operations:** < 1s combined

**Success Criteria:**
- ✅ Draft created in Outlook
- ✅ Email sounds authentic (Mike's voice)
- ✅ Enrichment relevant and recent
- ✅ Database records stored correctly
- ✅ Template rotation working (A→B→C→A)
- ✅ No errors or timeouts

---

## Cost Per Execution

| Operation | Cost |
|-----------|------|
| Perplexity AI enrichment | $0.005 |
| n8n execution | Free (included in plan) |
| Supabase queries | Free (within limits) |
| O365 Graph API | Free (included) |
| **Total per email** | **$0.005** |

**Monthly at 20/day:**
- 20 emails/day × 30 days = 600 emails
- 600 × $0.005 = **$3.00/month**

---

## Next Steps After Workflow Creation

1. **Import workflow into n8n Cloud**
2. **Set up credentials (Supabase, Perplexity, O365)**
3. **Test with 1 clinic**
4. **Integrate webhook URL into dashboard**
5. **Monitor first 5 executions**
6. **Document any adjustments needed**

---

*Specification Version: 1.0*
*Created: 2025-11-11*
*Phase: 4.2*
