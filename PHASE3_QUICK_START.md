# Phase 3 - Quick Start Guide

**For:** Developers and stakeholders
**Time Required:** 15-30 minutes
**Date:** 2025-11-09

---

## What's New in Phase 3?

4 major improvements to the dashboard:

1. **Removed Application Type Filter** - Cleaner UI
2. **Start Outreach Button** - One-click workflow trigger
3. **Service Type Modal** - View full details without truncation
4. **Consultant Tagging** - Smart routing for consultant contacts

---

## Quick Deploy (3 Steps)

### Option A: Automated (Recommended)

```bash
# Windows
deploy-phase3.bat

# Linux/Mac
./deploy-phase3.sh
```

The script will:
- Check prerequisites
- Guide you through database migration
- Install dependencies
- Run type check
- Build dashboard
- Create git commit
- Deploy to Vercel

### Option B: Manual

```bash
# 1. Apply database migration
# Copy contents of: database/migrations/20251109_add_outreach_and_consultant_fields.sql
# Paste into Supabase SQL Editor and run

# 2. Install and build
cd dashboard
npm install
npm run build

# 3. Deploy
git add .
git commit -m "feat: Phase 3 enhancements"
git push origin main
```

---

## Testing Checklist (5 minutes)

After deployment, test these features:

### 1. Application Type Filter Gone ✓
- [ ] Verify filter buttons removed from UI
- [ ] Only "Funding Year" and "Processed" filters remain

### 2. Start Outreach Button ✓
- [ ] Find a clinic card
- [ ] Click "Start Outreach" button
- [ ] Button changes to "Outreach Started"
- [ ] Orange "Ready" badge appears

### 3. Service Type Modal ✓
- [ ] Click "View Requested Services" button
- [ ] Modal opens with full text
- [ ] Text is readable and scrollable
- [ ] Close modal with X or outside click

### 4. Consultant Tagging ✓
- [ ] Expand contact section
- [ ] Click "Tag as Consultant" (primary contact)
- [ ] Purple "Consultant" badge appears
- [ ] Click "Tag as Consultant" (mail contact)
- [ ] Purple badge appears for mail contact too
- [ ] Toggle off by clicking "Remove Consultant Tag"

---

## Database Verification

Run this in Supabase SQL Editor:

```sql
-- Verify new fields exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
AND column_name IN ('outreach_status', 'contact_is_consultant', 'mail_contact_is_consultant');
-- Should return 3 rows

-- Test data
SELECT
  id,
  clinic_name,
  outreach_status,
  contact_is_consultant,
  mail_contact_is_consultant
FROM clinics_pending_review
LIMIT 5;
```

---

## Troubleshooting

**Build fails?**
```bash
cd dashboard
npm install
npm run type-check
```

**Modal doesn't work?**
```bash
# Check if dependency installed
npm list @radix-ui/react-dialog
# Should show version 1.1.4
```

**API errors?**
- Check browser console (F12)
- Check Supabase connection
- Verify migration ran successfully

**Changes not showing?**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check Vercel deployment status

---

## What Changed?

### Database (3 new fields)
- `outreach_status` - Tracks workflow progress
- `contact_is_consultant` - Tags primary contact
- `mail_contact_is_consultant` - Tags mail contact

### API (3 new routes)
- `POST /api/clinics/[id]/start-outreach`
- `POST /api/clinics/[id]/tag-primary-consultant`
- `POST /api/clinics/[id]/tag-mail-consultant`

### UI (4 updates)
- Removed Application Type filter
- Added Start Outreach button
- Service Type now opens in modal
- Consultant tagging buttons in contacts

---

## Next Steps

1. **Update Part 2 n8n Workflow**
   - Query for `outreach_status = 'ready_for_outreach'`
   - Check consultant flags
   - Route to appropriate email template
   - Update status to `'outreach_sent'`

2. **Monitor Dashboard**
   - Watch for errors
   - Collect user feedback
   - Track outreach conversion rates

3. **Optional Enhancements**
   - Add outreach status filter
   - Bulk consultant tagging
   - Auto-detect consultants
   - Audit log

---

## Documentation

**Quick Reference:**
- This file (PHASE3_QUICK_START.md)

**Detailed Guides:**
- PHASE3_DEPLOYMENT_GUIDE.md - Step-by-step deployment
- PHASE3_CHANGES_SUMMARY.md - Visual before/after
- CHECKPOINT_2025-11-09_PHASE3_COMPLETE.md - Full implementation details
- SCHEMA_CHANGES_PHASE3.md - Database documentation

---

## Support

**Issues?** Check the troubleshooting section above.

**Questions?** Review the detailed documentation files.

**Need help?** Contact the development team.

---

## Success Metrics

Phase 3 is successful when:

- ✅ All 4 UI changes are live
- ✅ Database migration completed
- ✅ No console errors
- ✅ All buttons work as expected
- ✅ Data updates persist
- ✅ n8n workflow picks up ready clinics

---

**Deployment Time:** ~15 minutes
**Testing Time:** ~5 minutes
**Total Time:** ~20 minutes

**Ready to deploy?** Run the deployment script or follow the manual steps above.

Good luck! 🚀
