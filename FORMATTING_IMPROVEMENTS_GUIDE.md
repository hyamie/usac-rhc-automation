# Email Formatting Improvements Guide
**Version:** 2.0
**Date:** 2025-11-13
**Status:** Ready to Implement

---

## 🎯 Objective

Improve email body formatting and enrichment context presentation to create more natural, professional, and readable outreach emails.

---

## 🐛 Current Problems

### Problem 1: Raw Enrichment Context Dump
**Current behavior:**
```
I noticed Honesdale Family Health Center filed a Form 465 for Funding Year 2025.

Based on my research, here are some recent developments:
- Breanne Phillips PA-C joined the team
- Rebecca Lalley received award
- etc...

Many rural health clinics don't realize...
```

**Issues:**
- Breaks the flow of the email
- Looks like a copy-paste from research notes
- Takes focus away from value proposition
- Too much detail for cold email

### Problem 2: Inconsistent Line Breaks
**Current behavior:**
- Some paragraphs have 3+ line breaks
- Irregular spacing between sections
- Inconsistent formatting

### Problem 3: No HTML Email Support
**Current behavior:**
- Only plain text emails
- No bold, italics, or formatting options
- Less professional appearance in modern email clients

---

## ✅ Solutions Implemented

### Solution 1: Natural Enrichment Integration

**New behavior:**
```
I noticed Honesdale Family Health Center filed a Form 465 for Funding Year 2025.
I also saw that Breanne Phillips PA-C recently joined the team.

Many rural health clinics don't realize...
```

**Improvements:**
1. ✅ Enrichment flows naturally after Form 465 mention
2. ✅ Only includes 1-2 most relevant facts
3. ✅ Formatted as a sentence, not bullet list
4. ✅ Maintains conversational tone

**Logic:**
```javascript
// Extract first 2-3 relevant facts from Perplexity
if (enrichmentContext.includes('\n-') || enrichmentContext.includes('\n•')) {
  const facts = enrichmentContext
    .split('\n')
    .filter(line => line.trim().match(/^[-•*]/))
    .slice(0, 2)
    .map(line => line.replace(/^[-•*]\s*/, '').trim());

  if (facts.length > 0) {
    enrichmentContext = facts.join(', and ') + '.';
  }
}

// Format as natural continuation
if (enrichmentContext.includes(clinic.clinic_name.toLowerCase())) {
  formattedEnrichment = `I also saw that ${enrichmentContext.charAt(0).toLowerCase()}${enrichmentContext.slice(1)}`;
} else {
  formattedEnrichment = enrichmentContext;
}
```

### Solution 2: Consistent Formatting

**New behavior:**
- Max 2 consecutive line breaks (double spacing between paragraphs)
- Single space after periods
- No double spaces
- Trimmed whitespace

**Logic:**
```javascript
// Normalize line breaks (max 2 consecutive)
renderedBody = renderedBody.replace(/\n{3,}/g, '\n\n');

// Remove any double spaces
renderedBody = renderedBody.replace(/  +/g, ' ');

// Ensure single space after periods
renderedBody = renderedBody.replace(/\.\s+/g, '. ');

// Trim leading/trailing whitespace
renderedBody = renderedBody.trim();
```

### Solution 3: HTML Email Support

**New behavior:**
- Both plain text and HTML versions generated
- HTML version has proper `<p>` tags for paragraphs
- Better rendering in modern email clients

**Logic:**
```javascript
// Create HTML version for better formatting
const htmlBody = renderedBody
  .split('\n\n')
  .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
  .join('');

return {
  body_rendered: renderedBody,  // Plain text version
  body_html: htmlBody,           // HTML version
  // ...
};
```

---

## 📁 Files Created

### 1. Improved Render Template Logic
**File:** `workflows/improved_render_template.js`

**What it does:**
- ✅ Extracts and cleans enrichment context
- ✅ Converts bullet lists to natural sentences
- ✅ Limits enrichment to 1-2 most relevant facts
- ✅ Formats enrichment as natural continuation
- ✅ Normalizes line breaks and spacing
- ✅ Generates both plain text and HTML versions
- ✅ Handles edge cases (missing data, empty enrichment)

**Key improvements:**
```javascript
// Before: Raw dump
.replace(/\{\{enrichment_context\}\}/g, enrichmentContext)

// After: Natural integration
.replace(/\{\{enrichment_context\}\}/g, formattedEnrichment)
// where formattedEnrichment = "I also saw that Breanne Phillips PA-C recently joined the team."
```

### 2. Updated Template SQL
**File:** `database/improved_templates_formatting.sql`

**What it does:**
- ✅ Updates all 6 templates (3 direct + 3 consultant)
- ✅ Consistent paragraph spacing
- ✅ Better enrichment context placement
- ✅ Cleaner subject lines
- ✅ Professional formatting throughout

**Changes:**
- Removed extra line breaks
- Ensured consistent spacing (double line break between paragraphs)
- Updated `generated_by` to `cold-email-agent-v2` for tracking
- Verified all placeholders are correct

---

## 🚀 Implementation Steps

### Step 1: Update n8n Workflow

1. Open n8n workflow: **"Outreach Email Generation (HTTP)"**

2. Find the **"Render Template"** node (Node 6)

3. Replace the JavaScript code with the contents of:
   `workflows/improved_render_template.js`

4. **IMPORTANT:** Update the **"Format O365 Body"** node to support HTML:

   **Current code:**
   ```javascript
   return {
     subject: $('Render Template').item.json.subject_rendered,
     body_rendered: $('Render Template').item.json.body_rendered,
     // ...
   };
   ```

   **New code (add HTML support):**
   ```javascript
   return {
     subject: $('Render Template').item.json.subject_rendered,
     body_rendered: $('Render Template').item.json.body_rendered,
     body_html: $('Render Template').item.json.body_html,
     // ...
   };
   ```

5. Update the **"O365: Create Draft"** HTTP Request node body:

   **Current:**
   ```json
   {
     "subject": "{{ $json.subject_rendered }}",
     "body": {
       "contentType": "Text",
       "content": "{{ $json.body_rendered }}"
     }
   }
   ```

   **New (with HTML support):**
   ```json
   {
     "subject": "{{ $json.subject_rendered }}",
     "body": {
       "contentType": "HTML",
       "content": "{{ $json.body_html }}"
     }
   }
   ```

   **Note:** You can also keep both versions and add a toggle parameter to choose plain text vs HTML.

6. **Test the workflow** with a test clinic

### Step 2: Update Database Templates (Optional)

The template changes are minor (mostly formatting). If you want to apply them:

1. Open Supabase SQL Editor
2. Run: `database/improved_templates_formatting.sql`
3. Verify templates updated:
   ```sql
   SELECT id, template_variant, contact_type, generated_by
   FROM email_templates
   WHERE generated_by = 'cold-email-agent-v2';
   ```

**Note:** This is optional because the main improvements are in the rendering logic, not the templates themselves.

### Step 3: Test End-to-End

1. Trigger workflow with test clinic ID:
   ```powershell
   $body = @{
     clinic_id = "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb"
   } | ConvertTo-Json

   Invoke-RestMethod -Method POST `
     -Uri "https://hyamie.app.n8n.cloud/webhook-test/outreach-email" `
     -Body $body `
     -ContentType "application/json"
   ```

2. Check draft in Mike's Outlook

3. Verify:
   - ✅ Enrichment context flows naturally
   - ✅ No excessive line breaks
   - ✅ Professional formatting
   - ✅ HTML rendering (if enabled)

---

## 📊 Before & After Examples

### Before (Current)
```
Hi Whittney,

I noticed Honesdale Family Health Center filed a Form 465 for Funding Year 2025.


Based on my research, here are some recent developments:
- Breanne Phillips, PA-C joined Honesdale Family Health Center
- Rebecca Lalley was honored with the inaugural Hometown Hero award
- The clinic has been serving the community since 1972


Many rural health clinics don't realize they're overpaying for internet connectivity...
```

**Issues:**
- ❌ Triple line breaks
- ❌ Research note format (bullet list)
- ❌ Too much detail
- ❌ Breaks email flow

### After (Improved)
```
Hi Whittney,

I noticed Honesdale Family Health Center filed a Form 465 for Funding Year 2025. I also saw that Breanne Phillips PA-C recently joined the team.

Many rural health clinics don't realize they're overpaying for internet connectivity. We serve healthcare facilities across Tennessee and surrounding states with enterprise-grade fiber connections at rates significantly lower than national carriers.

As an experienced ISP serving USAC RHC participants, we deliver symmetrical gigabit speeds with 99.9% uptime guarantees...
```

**Improvements:**
- ✅ Consistent double line breaks
- ✅ Natural sentence format
- ✅ Single relevant fact
- ✅ Smooth flow into value proposition

---

## 🧪 Testing Scenarios

### Test 1: Clinic with Recent News
**Clinic:** Honesdale Family Health Center
**Expected enrichment:** "I also saw that Breanne Phillips PA-C recently joined the team."
**Verify:** Natural integration, single fact

### Test 2: Clinic with No Recent News
**Clinic:** Generic clinic
**Expected enrichment:** Generic context or omitted
**Verify:** Email still flows well without specific enrichment

### Test 3: Consultant Contact
**Clinic:** Clinic with consultant contact
**Expected:** Consultant template with proper enrichment
**Verify:** Template selection works, enrichment fits consultant tone

### Test 4: HTML Formatting
**Verify:**
- Paragraphs separated properly
- No rendering issues
- Signature formatted correctly

---

## 📝 Additional Improvements (Future)

### 1. Conditional Enrichment
Only include enrichment if it's truly relevant:
```javascript
if (enrichmentScore > 0.7 && enrichmentContext.includes(clinic.clinic_name)) {
  // Include enrichment
} else {
  // Omit enrichment, use generic opening
}
```

### 2. Enrichment Quality Score
Add Perplexity prompt instruction:
```
Rate the relevance of this information to a cold email (1-10).
Only return information with relevance score > 7.
```

### 3. A/B Test Plain Text vs HTML
Track which format gets better open/reply rates:
- Template A, B, C with plain text
- Template A, B, C with HTML
- Store format type in `email_instances`
- Analyze in weekly performance report

---

## ✅ Checklist

- [ ] Review improved render template code
- [ ] Update n8n "Render Template" node
- [ ] Update "Format O365 Body" node for HTML support
- [ ] Update "O365: Create Draft" node to use HTML
- [ ] (Optional) Run improved templates SQL
- [ ] Test with Honesdale Family Health Center
- [ ] Test with consultant contact
- [ ] Test with clinic that has no recent news
- [ ] Verify HTML formatting in Outlook
- [ ] Mark todo #1 complete

---

## 🔗 Related Files

- `workflows/improved_render_template.js` - New render logic
- `database/improved_templates_formatting.sql` - Updated templates
- `workflows/outreach_email_generation_HTTP.json` - Current workflow
- `HANDOFF_20251112_WORKFLOW_COMPLETE.md` - Previous handoff

---

## 🚨 Important Notes

1. **Backup Current Workflow:** Export current n8n workflow before making changes
2. **Test in Test Mode:** Use webhook-test URL before activating
3. **HTML Fallback:** Always include plain text version as fallback
4. **Enrichment API Costs:** Monitor Perplexity costs (currently ~$0.005 per call)
5. **Template Version:** Consider creating new version `week-47-2025` vs updating `week-46-2025`

---

**End of Guide**
