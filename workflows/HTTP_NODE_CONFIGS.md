# HTTP Node Configurations for Supabase Operations
## Replace Supabase nodes with HTTP nodes in the workflow

---

## Shared Headers (Use for ALL HTTP nodes)

```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8
Prefer: return=representation
```

---

## Node 1: Get Clinic Details

**Replace:** "Get Clinic Details" (Supabase node)
**With:** HTTP Request node

**Configuration:**
```
Method: GET
URL: https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/clinics?id=eq.{{ $json.body.clinic_id }}&limit=1
```

**Headers:** (Use shared headers above)

**Response:** Returns clinic data

---

## Node 2: Get Template (A/B/C Selection)

**Replace:** "Get Template" (Supabase node)
**With:** HTTP Request node

**Configuration:**
```
Method: GET
URL: https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/email_templates?active=eq.true&version=eq.{{ $json.week_version }}&contact_type=eq.{{ $json.contact_type }}&order=times_used.asc&limit=1
```

**Headers:** (Use shared headers above)

**Response:** Returns least-used template (A/B/C rotation)

---

## Node 3: Store Email Instance

**Replace:** "Store Email Instance" (Supabase node)
**With:** HTTP Request node

**Configuration:**
```
Method: POST
URL: https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/email_instances
```

**Headers:** (Use shared headers above)

**Body (JSON):**
```json
{
  "clinic_id": "{{ $json.clinic_id }}",
  "template_id": "{{ $json.template_id }}",
  "subject_rendered": "{{ $json.subject_rendered }}",
  "body_rendered": "{{ $json.body_rendered }}",
  "enrichment_data": {{ $json.enrichment_data }},
  "draft_id": "{{ $json.draft_id }}",
  "draft_url": "{{ $json.draft_url }}",
  "draft_created_at": "{{ $now }}"
}
```

**Response:** Returns created email instance with ID

---

## Node 4: Update Template Usage

**Replace:** "Update Template Usage" (Supabase node)
**With:** HTTP Request node

**Configuration:**
```
Method: PATCH
URL: https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/email_templates?id=eq.{{ $json.template_id }}
```

**Headers:** (Use shared headers above)

**Body (JSON):**
```json
{
  "times_used": "{{ $json.times_used + 1 }}"
}
```

**Note:** You may need to get the current times_used value first, or use a Supabase function to increment.

**Alternative (Better):** Use Supabase RPC to increment:
```
Method: POST
URL: https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/rpc/increment_template_usage
Body: {"template_id": "{{ $json.template_id }}"}
```

But this requires creating a function in Supabase first:
```sql
CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE email_templates
  SET times_used = times_used + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Quick Conversion Steps:

For each Supabase node in the workflow:

1. **Delete the Supabase node**
2. **Add HTTP Request node** in same position
3. **Copy the configuration** from above
4. **Connect the wires** the same way
5. **Test the node** (Execute Node button)

---

## Credentials Setup:

**Option 1: No Credential (Headers in node)**
- Just paste the headers directly in each HTTP node

**Option 2: Header Auth Credential**
1. Settings → Credentials → Add "Header Auth"
2. Name: `apikey`
3. Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service key)
4. Add another "Header Auth" for Authorization

---

## Testing:

After converting all nodes, test each one individually:
1. Click on the node
2. Click "Execute Node" button
3. Check the output matches expected data
4. Fix any URL or body syntax issues

---

## Common Issues:

**Error: "relation does not exist"**
- Check table name is correct
- Make sure migrations ran successfully

**Error: "column does not exist"**
- Check field names match database schema
- Use exact column names from migrations

**Error: "permission denied"**
- Make sure using service_role key, not anon key
- Check RLS policies allow service_role access

---

**Base URL:** `https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/`
**Service Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`
