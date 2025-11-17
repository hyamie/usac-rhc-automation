# n8n Node Update Guide

## Database Update ✅
I've opened Supabase SQL Editor for you.

**Action Required:**
1. Copy the SQL from: `database/RUN_THIS_IN_SUPABASE.sql`
2. Paste it into the SQL Editor (should already be open)
3. Click "Run" to execute

---

## n8n Workflow Update

### Which Workflow?
**Workflow Name:** `USAC RHC - Main Daily Workflow V2 (Phase 2)`

### Which Node?
**Node Name:** `Process & Extract All Fields1`
- **Type:** Code (JavaScript)
- **Position:** Second node in the main workflow (after "Fetch Form 465 Filings")

### What to Change?

Find this section in the JavaScript code (around **line 60-65**):

**BEFORE (Current Code):**
```javascript
    // Program information
    program_type: 'Telecom',
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,
```

**AFTER (Add ONE line):**
```javascript
    // Program information
    program_type: 'Telecom',
    request_for_services: data.request_for_services || null,  // ← ADD THIS LINE
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,
```

### Visual Guide

1. **Open n8n**: https://hyamie.app.n8n.cloud
2. **Find the workflow**: "USAC RHC - Main Daily Workflow V2 (Phase 2)"
3. **Click the node**: "Process & Extract All Fields1"
4. **Scroll to line 60-65** in the JavaScript editor
5. **Add the line** as shown above
6. **Click "Save"**

### The Complete Context (for reference)

Here's what the full section should look like after the change:

```javascript
  // Build processed filing object with all Phase 2 fields
  const processed = {
    // Core identifiers
    hcp_number: data.hcp_number || data.health_care_provider_number,
    application_number: data.application_number || data.form_465_application_number,
    form_465_hash: hash,

    // Clinic information
    clinic_name: data.site_name || data.health_care_provider_name,
    address: data.site_address || data.service_delivery_site_physical_address,
    city: data.site_city || data.service_delivery_site_city,
    state: data.site_state || data.service_delivery_site_state,
    zip: data.site_zip || data.service_delivery_site_zip_code,

    // Contact information
    contact_name: data.contact_person_name || data.contact_name,
    contact_title: data.contact_person_title || data.contact_title,
    contact_email: contactEmail,
    contact_phone: data.contact_phone_number || data.contact_telephone_number,

    // Mail contact (potentially consultant)
    mail_contact_name: data.mail_contact_name || data.mailing_contact_name,
    mail_contact_email: mailContactEmail,
    mail_contact_company: data.mail_contact_company || data.mailing_contact_company,

    // Consultant detection
    is_consultant: isConsultant,
    consultant_company: isConsultant ? (data.mail_contact_company || data.mailing_contact_company) : null,
    consultant_email_domain: isConsultant ? mailDomain : null,
    consultant_detection_method: isConsultant ? 'auto_domain' : null,

    // Dates
    posting_date: data.posting_date,
    filing_date: data.form_465_date_certified || data.posting_date,
    allowable_contract_start_date: data.allowable_contract_date,

    // Program information
    program_type: 'Telecom',
    request_for_services: data.request_for_services || null,  // ← THE NEW LINE
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,

    // Contract details
    contract_length: data.contract_term_months || null,
    bandwidth: data.bandwidth_mbps || null,

    // PDF URL
    form_465_pdf_url: data.application_number ? `https://rhc.usac.org/rhc/public/viewPdf.seam?documentId=${data.application_number}` : null,

    // Status
    processed: false,
    created_at: new Date().toISOString()
  };
```

### Testing

After making the change:

1. **Execute the workflow** with the existing test data
2. **Check the output** of "Process & Extract All Fields1" node
3. **Verify** you see `request_for_services: "Voice"` in the output
4. **Check Supabase** to confirm the field is being saved

### Expected Output

You should see this in the node output:
```json
{
  "hcp_number": "50472",
  "program_type": "Telecom",
  "request_for_services": "Voice",  // ← Should appear here now!
  "service_type": null,
  ...
}
```

---

## Summary

**Database:** Run the SQL file I created ✅
**n8n Node:** `Process & Extract All Fields1`
**Change:** Add ONE line of code
**Location:** After `program_type: 'Telecom',`
**Code:** `request_for_services: data.request_for_services || null,`

That's it! This will capture the service type and make it available for sorting in your webapp.
