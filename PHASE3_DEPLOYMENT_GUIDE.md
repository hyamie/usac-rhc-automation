# Phase 3 Deployment Guide

**Date:** 2025-11-09
**Phase:** 3 - Dashboard Enhancements

## Overview

This guide walks through deploying the Phase 3 improvements to the USAC RHC Automation dashboard:

1. Remove Application Type filter
2. Add "Start Outreach" button with workflow integration
3. Convert Service Type display to modal popup
4. Add consultant tagging for contacts

---

## Pre-Deployment Checklist

- [ ] Backup current Supabase database
- [ ] Backup current dashboard deployment
- [ ] Review all code changes
- [ ] Ensure development environment is clean

---

## Step 1: Database Migration

### Apply the Schema Changes

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the contents of `database/migrations/20251109_add_outreach_and_consultant_fields.sql`
6. Paste into the SQL editor
7. Click **Run** or press `Ctrl+Enter`
8. Verify success message

**Option B: Via psql Command Line**

```bash
# From project root
psql -h [YOUR_SUPABASE_HOST].supabase.co \
     -U postgres \
     -d postgres \
     -f database/migrations/20251109_add_outreach_and_consultant_fields.sql
```

### Verify Migration

Run this verification query in Supabase SQL Editor:

```sql
-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
AND column_name IN ('outreach_status', 'contact_is_consultant', 'mail_contact_is_consultant');

-- Expected output: 3 rows showing the new columns

-- Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'clinics_pending_review'
AND indexname IN ('clinics_outreach_status_idx', 'clinics_consultant_contacts_idx');

-- Expected output: 2 rows showing the new indexes

-- Check existing data has default values
SELECT
  COUNT(*) as total_clinics,
  COUNT(*) FILTER (WHERE outreach_status = 'pending') as pending_status,
  COUNT(*) FILTER (WHERE contact_is_consultant = false) as not_consultant_primary,
  COUNT(*) FILTER (WHERE mail_contact_is_consultant = false) as not_consultant_mail
FROM clinics_pending_review;

-- Expected: All counts should match (all records have default values)
```

---

## Step 2: Dashboard Deployment

### Install Dependencies

```bash
cd dashboard
npm install
```

This will install the new `@radix-ui/react-dialog` dependency needed for the service type modal.

### Verify TypeScript Compilation

```bash
npm run type-check
```

Expected output: No errors

### Build for Production

```bash
npm run build
```

Expected output: Successful build with no errors or warnings

### Deploy to Vercel

**Option A: Via Git Push (Automated)**

```bash
# From project root
git add .
git commit -m "feat(dashboard): Phase 3 enhancements - outreach workflow and consultant tagging"
git push origin main
```

Vercel will automatically detect the push and deploy.

**Option B: Manual Deployment**

```bash
cd dashboard
npx vercel --prod
```

---

## Step 3: Post-Deployment Verification

### 1. Check Dashboard Loads

- [ ] Visit your dashboard URL
- [ ] Verify no console errors
- [ ] Verify clinic cards display correctly

### 2. Test Application Type Filter Removed

- [ ] Confirm the "Application Type" filter buttons are gone
- [ ] Verify only "Funding Year" and "Processed" filters remain in the bottom row
- [ ] Verify the Phase 2 filters (Date Range, Program Toggle, Consultant Filter) still work

### 3. Test Start Outreach Button

- [ ] Find a clinic card with status "pending"
- [ ] Click "Start Outreach" button
- [ ] Button should show "Loading..." briefly
- [ ] Button should change to "Outreach Started" and become disabled
- [ ] Badge should appear showing "Ready" in orange
- [ ] Page should refresh automatically

**Verify in Database:**

```sql
SELECT id, clinic_name, outreach_status, updated_at
FROM clinics_pending_review
WHERE outreach_status = 'ready_for_outreach'
ORDER BY updated_at DESC
LIMIT 5;
```

### 4. Test Service Type Modal

- [ ] Find a clinic card with a service_type value
- [ ] Click "View Requested Services" button
- [ ] Modal should open showing full service type text
- [ ] Text should wrap properly and be readable
- [ ] Click X or outside modal to close
- [ ] Modal should close smoothly

### 5. Test Primary Contact Consultant Tagging

- [ ] Open a clinic card's contact section
- [ ] Click "Tag as Consultant" button under Primary Contact
- [ ] Button text should change to "Updating..."
- [ ] Purple "Consultant" badge should appear
- [ ] Button should change to "Remove Consultant Tag"
- [ ] Page should refresh automatically

**Verify in Database:**

```sql
SELECT id, clinic_name, contact_email, contact_is_consultant, updated_at
FROM clinics_pending_review
WHERE contact_is_consultant = true
ORDER BY updated_at DESC
LIMIT 5;
```

### 6. Test Mail Contact Consultant Tagging

- [ ] Open a clinic card's contact section with a mail contact
- [ ] Click "Tag as Consultant" button under Mailing Contact
- [ ] Button text should change to "Updating..."
- [ ] Purple "Consultant" badge should appear
- [ ] Button should change to "Remove Consultant Tag"
- [ ] Page should refresh automatically

**Verify in Database:**

```sql
SELECT id, clinic_name, mail_contact_email, mail_contact_is_consultant, updated_at
FROM clinics_pending_review
WHERE mail_contact_is_consultant = true
ORDER BY updated_at DESC
LIMIT 5;
```

### 7. Test Toggling Consultant Tags

- [ ] Click "Remove Consultant Tag" on a tagged contact
- [ ] Badge should disappear
- [ ] Button should change back to "Tag as Consultant"
- [ ] Toggle again to re-tag
- [ ] Verify smooth operation

### 8. Test Error Handling

**Invalid Clinic ID:**

Try accessing: `/api/clinics/invalid-id/start-outreach`

Expected: 400 Bad Request

**Non-existent Clinic:**

Try accessing: `/api/clinics/00000000-0000-0000-0000-000000000000/start-outreach`

Expected: 404 Not Found

---

## Step 4: n8n Workflow Integration

### Update Part 2 Workflow (Optional for now)

The Part 2 n8n workflow should be updated to:

1. Query for clinics with `outreach_status = 'ready_for_outreach'`
2. Check `contact_is_consultant` and `mail_contact_is_consultant` flags
3. Route to different email templates based on consultant status
4. Update `outreach_status` to `'outreach_sent'` after sending email

**Sample n8n Workflow Update:**

```javascript
// In the "Get Ready Clinics" Supabase node:
// Update the filter to:
{
  "outreach_status": {
    "eq": "ready_for_outreach"
  }
}

// In the "Route by Contact Type" IF node:
// Add conditions:
if ($json.contact_is_consultant === true) {
  return [0]; // Route to consultant template
} else {
  return [1]; // Route to standard template
}

// After sending email, in the "Update Status" Supabase node:
{
  "outreach_status": "outreach_sent"
}
```

---

## Rollback Procedure

If issues are encountered:

### 1. Rollback Dashboard

```bash
# Via Vercel dashboard
# Go to your project > Deployments
# Find the previous working deployment
# Click "..." > "Promote to Production"

# Or via Git
git revert HEAD
git push origin main
```

### 2. Rollback Database

```sql
-- Remove indexes
DROP INDEX IF EXISTS public.clinics_outreach_status_idx;
DROP INDEX IF EXISTS public.clinics_consultant_contacts_idx;

-- Remove columns
ALTER TABLE public.clinics_pending_review DROP COLUMN IF EXISTS outreach_status;
ALTER TABLE public.clinics_pending_review DROP COLUMN IF EXISTS contact_is_consultant;
ALTER TABLE public.clinics_pending_review DROP COLUMN IF EXISTS mail_contact_is_consultant;
```

---

## Monitoring and Logs

### Check Application Logs

**Vercel Logs:**

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by timeframe
5. Look for errors related to API routes

**Browser Console:**

- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed API calls

### Database Query Performance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'clinics_pending_review'
AND indexname IN ('clinics_outreach_status_idx', 'clinics_consultant_contacts_idx');
```

---

## Known Issues and Limitations

### Current Limitations

1. **No Undo for Outreach Start**: Once "Start Outreach" is clicked, it cannot be undone via UI
   - Workaround: Update via Supabase dashboard SQL
2. **No Bulk Operations**: Can only tag one contact at a time
   - Future enhancement: Add bulk tagging
3. **No Outreach History**: Cannot see when outreach was started
   - Future enhancement: Add audit log or history table

### Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

---

## Success Criteria

Phase 3 deployment is successful when:

- [x] All database migration queries execute without errors
- [x] Application Type filter is removed from UI
- [x] Start Outreach button appears on all clinic cards
- [x] Clicking Start Outreach updates `outreach_status` to `ready_for_outreach`
- [x] Service Type opens in a modal when clicked
- [x] Tag as Consultant buttons work for both primary and mail contacts
- [x] Consultant badges appear when contacts are tagged
- [x] All API routes respond correctly
- [x] No TypeScript compilation errors
- [x] No console errors in browser
- [x] Page refreshes automatically after updates
- [x] Database indexes are created and functional

---

## Support and Troubleshooting

### Common Issues

**Issue:** Modal doesn't open
- **Solution:** Check browser console for errors, verify `@radix-ui/react-dialog` is installed

**Issue:** Start Outreach button doesn't work
- **Solution:** Check API route at `/api/clinics/[id]/start-outreach`, verify Supabase connection

**Issue:** Consultant tags don't persist
- **Solution:** Verify database migration ran successfully, check API responses in Network tab

**Issue:** TypeScript errors
- **Solution:** Run `npm install` to ensure all dependencies are installed, run `npm run type-check`

---

## Next Steps (Future Enhancements)

1. Add outreach status filter to dashboard
2. Add bulk operations for consultant tagging
3. Add audit log for tracking changes
4. Implement email preview before sending
5. Add notes/comments feature for clinics
6. Create dashboard analytics for outreach conversion rates

---

## Files Modified in Phase 3

### Database
- `database/migrations/20251109_add_outreach_and_consultant_fields.sql` (new)

### Types
- `dashboard/src/types/database.types.ts` (updated)

### API Routes
- `dashboard/src/app/api/clinics/[id]/start-outreach/route.ts` (new)
- `dashboard/src/app/api/clinics/[id]/tag-primary-consultant/route.ts` (new)
- `dashboard/src/app/api/clinics/[id]/tag-mail-consultant/route.ts` (new)

### Components
- `dashboard/src/components/ui/dialog.tsx` (new)
- `dashboard/src/components/clinics/ClinicCard.tsx` (updated)
- `dashboard/src/components/clinics/ClinicList.tsx` (updated)

### Configuration
- `dashboard/package.json` (updated - added @radix-ui/react-dialog)

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Sign-off:** _________________
