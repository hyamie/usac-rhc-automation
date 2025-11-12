# Test Configuration for n8n Workflow

## Issue Found
The workflow HTTP node is querying: `/rest/v1/clinics`
But your database table is actually: `/rest/v1/clinics_pending_review`

## Fix Required in n8n

### Node 2: Get Clinic Details

**Current URL:**
```
https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/clinics?id=eq.{{ $json.body.clinic_id }}&limit=1
```

**Should be:**
```
https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/clinics_pending_review?id=eq.{{ $json.body.clinic_id }}&limit=1
```

## Test Data for Workflow

Use this for testing:

```json
{
  "clinic_id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb",
  "user_id": "test-user-123"
}
```

## Clinic Details (HCP 50472)

```json
{
  "id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb",
  "hcp_number": "50472",
  "clinic_name": "Honesdale Family Health Center",
  "city": "HONESDALE",
  "state": "PA",
  "funding_year": "2026",
  "contact_email": "wwalker@communityhospitalcorp.com",
  "mail_contact_first_name": "Whittney",
  "mail_contact_last_name": "Walker",
  "mail_contact_org_name": "Community Hospital Corporation",
  "mail_contact_phone": "(972) 943-1226"
}
```

## Step-by-Step Test in n8n

### 1. Fix the Table Name

1. Open workflow: "Outreach Email Generation (HTTP)"
2. Click on: **"Get Clinic Details"** node (Node 2)
3. Change URL from: `.../clinics?...` to `.../clinics_pending_review?...`
4. Click **Save**

### 2. Test Node 2 Individually

1. Click on: **"Get Clinic Details"** node
2. Click: **"Execute Node"** button
3. In the test input, you'll need to provide:
   ```json
   {
     "body": {
       "clinic_id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb"
     }
   }
   ```
4. Should return clinic data

### 3. Test Nodes 3-6 (Without O365)

After Node 2 works:

- Node 3: **Determine Contact Type** - Should calculate week version
- Node 4: **Get Template** - Should return one of A/B/C templates
- Node 5: **Perplexity Enrichment** - Should get recent clinic info
- Node 6: **Render Template** - Should create personalized email text

### 4. Check Each Node Output

After each node execution, check:
- ✅ No errors
- ✅ Data passed to next node
- ✅ Variables populated correctly

## Expected Test Results

**Node 2 Output:**
```json
{
  "id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb",
  "clinic_name": "Honesdale Family Health Center",
  "state": "PA",
  "contact_email": "wwalker@communityhospitalcorp.com"
}
```

**Node 3 Output:**
```json
{
  ...clinic_data,
  "contact_type": "direct",
  "week_version": "week-46-2025"
}
```

**Node 4 Output:**
```json
{
  "id": "[template-uuid]",
  "template_variant": "A" or "B" or "C",
  "subject_template": "...",
  "body_template": "..."
}
```

**Node 5 Output:**
```json
{
  "choices": [{
    "message": {
      "content": "Recent information about Honesdale Family Health Center..."
    }
  }]
}
```

**Node 6 Output:**
```json
{
  "clinic_id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb",
  "template_id": "[template-uuid]",
  "template_variant": "A",
  "subject_rendered": "USAC RHC Support - Honesdale Family Health Center",
  "body_rendered": "Whittney,\n\nI saw Honesdale Family Health Center's Form 465...",
  "recipient_email": "wwalker@communityhospitalcorp.com"
}
```

## Alternative: Create Test Clinics Table Alias

If you want to keep using "clinics" in the workflow:

```sql
-- In Supabase SQL Editor
CREATE VIEW clinics AS SELECT * FROM clinics_pending_review;
```

This creates an alias so both names work.
