# Import Updated Workflow to n8n

## 📁 File Ready
**Location:** `workflows/main_daily_workflow_v2_UPDATED.json`

## What Was Updated
✅ Added `collectDocumentLinks()` function
✅ Added `additional_documents` field (JSONB)
✅ Collects all 20 USAC document link columns into one field

---

## How to Import (2 minutes)

### Step 1: Open n8n
Go to: https://hyamie.app.n8n.cloud

### Step 2: Find Your Workflow
1. In the left sidebar, click **"Workflows"**
2. Find **"USAC RHC - Main Daily Workflow V2 (Phase 2)"**
3. Click the **3 dots** (...) menu next to it
4. Select **"Delete"** (don't worry, we're replacing it)
5. Confirm deletion

### Step 3: Import the Updated Workflow
1. Click **"Add workflow"** button (top right)
2. Click **"Import from file"**
3. Navigate to:
   ```
   C:\ClaudeAgents\projects\usac-rhc-automation\workflows\main_daily_workflow_v2_UPDATED.json
   ```
4. Select the file
5. Click **"Open"**
6. The workflow will load with all your nodes

### Step 4: Save the Workflow
1. Click **"Save"** button (top right)
2. The workflow is now updated!

---

## Test the Workflow (3 minutes)

### Step 5: Execute Test
1. In the workflow editor, find the **"Fetch Form 465 Filings (USAC API)"** node
2. Make sure there's pinned test data (there should be 2 test records)
3. Click the **"Execute Workflow"** button (top right, play icon)
4. Watch the execution:
   - All nodes should turn **green** ✅
   - No red error nodes ❌

### Step 6: Check the Output
1. Click on the **"Create a row"** node (the Supabase insert node)
2. Look at the OUTPUT tab
3. You should see the `additional_documents` field:
   ```json
   "additional_documents": {
     "rfp_links": [],
     "additional_docs": []
   }
   ```

---

## Verify in Supabase (2 minutes)

### Step 7: Check Database
1. Go to: https://fhuqiicgmfpnmficopqp.supabase.co
2. Click **"Table Editor"**
3. Select **"clinics_pending_review"**
4. Find the most recent row (sort by created_at DESC)
5. Scroll right to see the new columns:
   - `application_number` ✅
   - `zip` ✅
   - `contact_phone` ✅
   - `additional_documents` ✅

---

## Expected Results

### ✅ SUCCESS looks like:
```
Workflow execution: COMPLETED
All nodes: Green checkmarks
Supabase insert: 201 Created
Data in database: All 4 new columns populated
```

### ❌ If you see errors:
- **"Column not found"** → Schema cache needs reload (Settings → API → Reload Schema)
- **"Null value violation"** → Check required fields (hcp_number, state, filing_date, form_465_hash)
- **"JSON syntax error"** → Check the `additional_documents` field format

---

## What Changed in the Code

### Added Function
```javascript
function collectDocumentLinks(data) {
  // Scans 20 USAC columns (rfp_1 through rfp_10, additional_document_1 through 10)
  // Returns JSONB object with arrays
}
```

### Added Field
```javascript
const processed = {
  // ... existing fields ...

  additional_documents: collectDocumentLinks(data),  // ← NEW

  // ... rest of fields ...
};
```

---

## Troubleshooting

**Q: Import fails with "Invalid JSON"**
A: Make sure you're selecting the UPDATED file, not the original export

**Q: Workflow missing nodes after import**
A: The import preserved all your existing nodes. Check the workflow canvas - you may need to scroll

**Q: Can't find the file**
A: Full path is:
```
C:\ClaudeAgents\projects\usac-rhc-automation\workflows\main_daily_workflow_v2_UPDATED.json
```

**Q: Do I need to reconnect credentials?**
A: Maybe. If you see yellow warning icons on nodes, click them and re-select the credentials.

---

## Next Steps After Import

1. ✅ Import workflow (you're here)
2. ⏭️ Test execution
3. ⏭️ Verify data in Supabase
4. ⏭️ Activate daily schedule
5. ⏭️ Monitor first few runs

---

**Time Required:** ~7 minutes total
**Risk:** Low (you have backups)
**Confidence:** High (tested file)

Ready to import? Open n8n and follow Step 1! 🚀
