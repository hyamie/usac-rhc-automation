# n8n Workflow Import Guide
## Phase 4.2: Outreach Email Generation

---

## Prerequisites

Before importing, ensure you've completed:

- [x] Phase 4.1 database migrations (5 tables created)
- [ ] API credentials setup (see `API_CREDENTIALS_SETUP.md`)
- [ ] n8n Cloud account access: https://hyamie.app.n8n.cloud

---

## Import Steps

### Step 1: Open n8n Cloud

1. Go to: https://hyamie.app.n8n.cloud
2. Log in with your account
3. You should see the n8n dashboard

### Step 2: Import Workflow JSON

**Method A: Direct Import (Recommended)**

1. Click the **"+"** button (top left) → **"Import from File"**
2. Browse to: `C:\claudeagents\projects\usac-rhc-automation\workflows\outreach_email_generation.json`
3. Select the file
4. Click: **"Open"** or **"Import"**
5. Workflow should appear with 10 nodes

**Method B: Copy-Paste**

1. Click the **"+"** button → **"Import from URL or String"**
2. Open `outreach_email_generation.json` in a text editor
3. Copy the entire contents (Ctrl+A, Ctrl+C)
4. Paste into n8n import dialog
5. Click: **"Import"**

### Step 3: Verify Import Success

You should see:
- **Workflow name:** "Outreach Email Generation"
- **10 nodes:** Webhook → Get Clinic → Determine Type → Get Template → Perplexity → Render → O365 → Store Instance → Update Usage → Respond
- **All nodes connected** in a linear flow
- **Red warning icons** on some nodes (expected - credentials not configured yet)

---

## Configure Credentials

After import, you need to configure credentials for 4 nodes:

### Node 2: Get Clinic Details (Supabase)

1. Click on the **"Get Clinic Details"** node
2. Under **Credentials**, click the dropdown
3. Select: **"USAC Supabase"** (should already exist)
4. If not found:
   - Click: **"+ Create New"**
   - Type: **Supabase API**
   - Name: `USAC Supabase`
   - Host: `fhuqiicgmfpnmficopqp.supabase.co`
   - Service Role Key: (from `dashboard/.env.local`)
5. Test connection
6. Save

**Repeat for nodes:**
- Node 4: **Get Template (Rotating)** → Same Supabase credential
- Node 8: **Store Email Instance** → Same Supabase credential
- Node 9: **Increment Template Usage** → Same Supabase credential

### Node 5: Perplexity: Enrich Context

1. Click on the **"Perplexity: Enrich Context"** node
2. Under **Credentials**, click dropdown
3. Select: **"Perplexity API"** (if you created it) or:
4. Click: **"+ Create New"**
   - Type: **HTTP Header Auth**
   - Name: `Perplexity API`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_PERPLEXITY_API_KEY`
5. Test with a sample request
6. Save

### Node 7: O365: Create Draft

1. Click on the **"O365: Create Draft"** node
2. Under **Credentials**, click dropdown
3. Select: **"O365 Mike Hyams"** (if you created it) or:
4. Click: **"+ Create New"**
   - Type: **Microsoft OAuth2 API**
   - Follow setup in `API_CREDENTIALS_SETUP.md` section 3
5. Authenticate with Mike's O365 account
6. Save

### Node 1: Webhook Authentication (Variable)

1. Go to: **Settings** (gear icon) → **Variables**
2. Check if `WEBHOOK_AUTH_TOKEN` exists
3. If not, add it:
   - Name: `WEBHOOK_AUTH_TOKEN`
   - Value: (generate with `openssl rand -hex 32`)
4. Save
5. Copy token value - you'll need it for dashboard

---

## Activate Workflow

### Step 1: Save Workflow

1. Click: **Save** (top right)
2. Workflow should save successfully
3. No error icons should remain

### Step 2: Activate

1. Toggle the **Active** switch (top right) to **ON**
2. Workflow status should change to "Active"
3. Webhook URL will be generated

### Step 3: Get Webhook URL

1. Click on **"Webhook: Start Outreach"** node
2. Look for **"Production URL"** or **"Webhook URL"**
3. Should be: `https://hyamie.app.n8n.cloud/webhook/outreach-email`
4. **Copy this URL** - you'll add it to dashboard `.env.local`

---

## Test Workflow

### Test 1: Manual Test in n8n

**Before running, ensure:**
- Database migrations are run (Phase 4.1)
- At least 1 template exists in `email_templates`
- At least 1 clinic exists in `clinics`

**Steps:**

1. Click on **"Webhook: Start Outreach"** node
2. Click: **"Listen for Test Event"** button
3. n8n will wait for a webhook call...

4. In a separate terminal or Postman, send test request:

```bash
curl -X POST https://hyamie.app.n8n.cloud/webhook/outreach-email \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: YOUR_TOKEN_HERE" \
  -d '{
    "clinic_id": "YOUR_CLINIC_UUID",
    "user_id": "YOUR_USER_UUID"
  }'
```

5. Watch execution in n8n
6. All nodes should turn green ✅
7. Check final output

**Expected Output:**
```json
{
  "success": true,
  "draft_url": "https://outlook.office365.com/owa/?ItemID=...",
  "draft_id": "AAMkAGE...",
  "template_variant": "B",
  "instance_id": "uuid",
  "enrichment_preview": "Recent expansion to 3 counties...",
  "subject": "Quick question - Clinic Name Form 465",
  "generated_at": "2025-11-11T16:30:00Z"
}
```

### Test 2: Verify Results

**Check 1: Email Draft Created**
1. Open: https://outlook.office365.com
2. Navigate to: **Drafts** folder
3. Find draft with subject from test
4. Open and read
5. Verify:
   - ✅ Subject is personalized
   - ✅ Body includes enrichment context
   - ✅ First name is correct
   - ✅ Sounds like Mike wrote it

**Check 2: Database Record**
```sql
-- In Supabase SQL Editor
SELECT * FROM email_instances ORDER BY created_at DESC LIMIT 1;
```

Should see:
- Clinic ID matches test input
- Template ID is populated
- Subject and body are rendered
- Enrichment data is stored
- Draft ID and URL are saved

**Check 3: Template Usage Incremented**
```sql
SELECT template_variant, times_used
FROM email_templates
WHERE version = 'week-46-2025' AND active = true;
```

The used template's `times_used` count should have increased by 1

---

## Troubleshooting

### Error: "Clinic not found"

**Cause:** No clinic with that ID in database
**Fix:**
```sql
-- Get a valid clinic ID
SELECT id, clinic_name FROM clinics LIMIT 1;
-- Use that ID in your test request
```

### Error: "No active templates found"

**Cause:** Database migrations not run or templates not inserted
**Fix:**
1. Run `database/phase4_migrations.sql`
2. Run `database/phase4_bootstrap_voice_model.sql`
3. Run `insert_templates_week-46-2025_direct.sql`

### Error: "Perplexity API authentication failed"

**Cause:** API key incorrect or expired
**Fix:**
1. Verify API key in Perplexity dashboard
2. Check credential format: `Bearer pplx-...`
3. Test API key with curl

### Error: "O365 token expired"

**Cause:** OAuth token needs refresh
**Fix:**
1. Go to n8n Credentials
2. Find "O365 Mike Hyams"
3. Click: **"Reconnect"**
4. Re-authenticate

### Error: "401 Unauthorized" on webhook

**Cause:** Webhook token mismatch
**Fix:**
1. Check `WEBHOOK_AUTH_TOKEN` in n8n Variables
2. Verify token in request header matches
3. Ensure header name is exactly: `X-Webhook-Token`

### Node stays yellow/pending

**Cause:** Timeout or slow API
**Fix:**
1. Increase timeout in HTTP Request node settings
2. Check Perplexity API response time
3. Verify internet connection

---

## Performance Monitoring

### Execution Time Breakdown

Expected timings:
- **Node 1-4 (Database):** < 1 second
- **Node 5 (Perplexity):** 2-4 seconds
- **Node 6 (Render):** < 0.5 seconds
- **Node 7 (O365):** 1-2 seconds
- **Node 8-10 (Database + Response):** < 1 second
- **Total:** 5-10 seconds

### Monitoring in n8n

1. Go to: **Executions** tab
2. View recent runs
3. Click on execution to see details
4. Check each node's execution time
5. Look for bottlenecks

### Set Up Alerts

1. Settings → **Workflows**
2. Find: "Outreach Email Generation"
3. Click: **Settings** (gear icon)
4. **Error Workflow:**
   - Create separate error handling workflow
   - Email or Slack notification on failure
5. **Save Error Workflow**

---

## Integration with Dashboard

After workflow is active and tested:

### Step 1: Add Webhook URL to Dashboard

Edit `dashboard/.env.local`:

```bash
# n8n Outreach Workflow
N8N_OUTREACH_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/outreach-email
N8N_WEBHOOK_AUTH_TOKEN=your-token-here
```

### Step 2: Create Dashboard API Function

Create: `dashboard/lib/outreach.ts`

```typescript
export async function generateOutreachEmail(clinicId: string, userId: string) {
  const response = await fetch(process.env.N8N_OUTREACH_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Token': process.env.N8N_WEBHOOK_AUTH_TOKEN!
    },
    body: JSON.stringify({
      clinic_id: clinicId,
      user_id: userId
    })
  });

  if (!response.ok) {
    throw new Error(`Workflow failed: ${response.statusText}`);
  }

  return response.json();
}
```

### Step 3: Add "Start Outreach" Button

In clinic card component:

```tsx
import { generateOutreachEmail } from '@/lib/outreach';

const handleStartOutreach = async () => {
  try {
    setLoading(true);
    const result = await generateOutreachEmail(clinic.id, user.id);

    // Show success
    toast.success(`Draft created! Opening in Outlook...`);

    // Open draft in new tab
    window.open(result.draft_url, '_blank');

    // Refresh clinic data
    await refreshClinic();
  } catch (error) {
    toast.error(`Failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

return (
  <button onClick={handleStartOutreach} disabled={loading}>
    {loading ? 'Creating Draft...' : '🚀 Start Outreach'}
  </button>
);
```

---

## Production Checklist

Before using in production:

- [ ] All credentials tested individually
- [ ] End-to-end test successful
- [ ] Email draft looks correct in Outlook
- [ ] Enrichment context is relevant
- [ ] Database records stored properly
- [ ] Template rotation working (test multiple times)
- [ ] Error handling tested (invalid clinic ID, etc.)
- [ ] Performance within 10-second target
- [ ] Dashboard integration complete
- [ ] Monitoring/alerts configured

---

## Workflow Maintenance

### Weekly Tasks

- Check execution logs for errors
- Monitor Perplexity API usage/costs
- Verify template rotation is fair
- Review enrichment quality

### Monthly Tasks

- Rotate webhook authentication token
- Review execution performance trends
- Update templates if needed
- Check O365 token expiry

### As Needed

- Regenerate templates weekly (Monday 6 AM)
- Update workflow if node types change
- Add error handling improvements
- Optimize slow nodes

---

## Next Steps

After successful import and testing:

1. ✅ Workflow active in n8n Cloud
2. → Test with 3-5 clinics
3. → Review generated drafts for quality
4. → Adjust enrichment prompt if needed
5. → Move to Phase 4.3 (Learning System)

---

*Import Guide Version: 1.0*
*Created: 2025-11-11*
*Phase: 4.2*
