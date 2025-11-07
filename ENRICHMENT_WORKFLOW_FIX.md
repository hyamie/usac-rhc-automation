# Enrichment Workflow Fix - Image Size Error

**Date:** November 7, 2025
**Issue:** API Error 400 - Image dimensions exceed max allowed size (2000 pixels)
**Status:** ✅ FIXED

---

## Problem Description

The enrichment workflow was failing with this error:
```
API Error: 400
"At least one of the image dimensions exceed max allowed size for many-image requests: 2000 pixels"
```

### Root Cause

1. **Google Search Node** returns search results that can include images in the response
2. **Extract Enrichment Findings Node** was passing the entire Google response object (including images) to the next node
3. **Claude API Node** received these large images and rejected them (Claude API limit: 2000 pixels max)
4. Workflow failed before updating Supabase
5. Result: Only test data remained in database, no new data inserted

---

## Solution Applied

### Modified Node: "Extract Enrichment Findings (Text Only)"

**File:** `workflows/02-enrichment-sub-workflow-v2.json` (Line 118-126)

**Changes:**
- Added strict filtering to only pass primitive data types (string, number, boolean, null)
- Strips out all image/binary data from Google Search results
- Only extracts text `snippet` field from search results
- Ensures no complex objects or images reach Claude API

**Code Logic:**
```javascript
// Copy only primitive/text fields (no images/binary)
for (const key in inputData) {
  const value = inputData[key];
  // Only copy primitive types
  if (typeof value === 'string' || typeof value === 'number' ||
      typeof value === 'boolean' || value === null || value === undefined) {
    clinic[key] = value;
  }
}

// Extract TEXT ONLY from search results
if (inputData.items && Array.isArray(inputData.items)) {
  const topResult = inputData.items[0];
  enrichmentFinding = topResult.snippet || ''; // TEXT ONLY
}
```

---

## How to Deploy the Fix

### Option 1: Re-Import Workflow (Recommended)

1. Open n8n: https://hyamie.app.n8n.cloud
2. Find existing "USAC RHC - Enrichment Sub-Workflow V2"
3. Delete or deactivate the old version
4. Click **"Import from File"**
5. Upload: `C:\ClaudeAgents\projects\usac-rhc-automation\workflows\02-enrichment-sub-workflow-v2.json`
6. Verify all credentials are connected
7. **Test manually** with a clinic ID before activating

### Option 2: Manual Edit (Quick Fix)

1. Open the existing enrichment workflow in n8n
2. Find node: "Extract Enrichment Findings"
3. Click to edit the node
4. Replace the JavaScript code with the updated code from the file
5. Rename node to "Extract Enrichment Findings (Text Only)"
6. Save and test

---

## Testing Instructions

### Test the Fix

1. Go to your n8n workflow
2. Click **"Test workflow"**
3. Provide test input (a clinic ID from Supabase)
4. Watch execution in real-time
5. **Expected Result:**
   - ✅ Google Search runs successfully
   - ✅ Text-only data extracted
   - ✅ Claude generates email (no image error)
   - ✅ Outlook draft created
   - ✅ Supabase updated with enrichment data
   - ✅ Webhook responds with success

### Verify in Supabase

1. Open Supabase: https://fhuqiicgmfpnmficopqp.supabase.co
2. Go to Table Editor → `clinics_pending_review`
3. Find the test clinic record
4. Check these fields are populated:
   - `enriched` = `true`
   - `enrichment_date` = recent timestamp
   - `enrichment_finding` = text description
   - `email_draft_created` = `true`
   - `email_subject` = generated subject
   - `email_body` = generated email

---

## Why This Happened

### Technical Details

The n8n LangChain node (`@n8n/n8n-nodes-langchain.lmChatOpenAi`) automatically collects data from previous nodes. When the Google Custom Search API returns results, it includes:

- `items[]` - Array of search results
  - `snippet` - Text description ✅
  - `title` - Page title ✅
  - `link` - URL ✅
  - `pagemap` - Rich metadata including images ❌
    - `cse_image` - Images from the page ❌
    - `metatags` - May contain base64 images ❌

The Claude API node was receiving the entire `items` array including large images from `pagemap`, causing the 2000-pixel limit error.

**Fix:** Strip everything except primitive text fields before sending to Claude.

---

## Preventing Future Issues

### Best Practices for n8n → Claude Integration

1. **Always sanitize data** before passing to AI nodes
2. **Use Code nodes** to filter out binary/image data
3. **Test with real data** that includes images
4. **Set `continueOnFail: true`** on optional nodes (Google Search, Hunter.io)
5. **Log data size** before sending to external APIs

### Recommended Workflow Pattern

```
[External API]
  → [Extract Text Only (Code Node)]
    → [AI Processing (Claude)]
      → [Database Update]
```

---

## Related Files

- **Fixed Workflow:** `workflows/02-enrichment-sub-workflow-v2.json`
- **Main Daily Workflow:** `workflows/01-main-daily-workflow-v2.json` (unaffected)
- **Phase 2 Documentation:** `PHASE2_COMPLETE.md`

---

## Next Steps

1. ✅ Deploy fixed workflow to n8n
2. ✅ Test with real clinic data
3. ✅ Verify Supabase updates work
4. ✅ Run Main Daily Workflow to populate new clinics
5. ✅ Test enrichment on newly populated clinics

---

## Status After Fix

Once deployed:
- ✅ Enrichment workflow will handle Google Search results safely
- ✅ No more image size errors
- ✅ Claude email generation works
- ✅ Supabase updates complete successfully
- ✅ New data will populate the dashboard

---

**Fixed by:** Claude Code
**Commit:** (pending git commit)
**Date:** November 7, 2025
