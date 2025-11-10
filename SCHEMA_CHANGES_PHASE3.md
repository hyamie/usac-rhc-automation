# Phase 3 Database Schema Changes

**Date:** 2025-11-09
**Status:** Ready for Implementation

## Overview

This document outlines the database schema changes needed to support the Phase 3 dashboard improvements:
- Outreach workflow tracking
- Consultant contact tagging
- Enhanced UI features

---

## Database Changes

### New Fields Added to `clinics_pending_review`

#### 1. Outreach Status Field
```sql
outreach_status text DEFAULT 'pending'
  CHECK (outreach_status IN ('pending', 'ready_for_outreach', 'outreach_sent', 'follow_up', 'completed'))
```

**Purpose:** Track clinics through the outreach workflow pipeline

**Values:**
- `pending` - Initial state (default)
- `ready_for_outreach` - User clicked "Start Outreach" button
- `outreach_sent` - Email/outreach has been sent via Part 2 workflow
- `follow_up` - Needs additional follow-up contact
- `completed` - Outreach cycle complete

**Usage in UI:**
- "Start Outreach" button updates this to `ready_for_outreach`
- Part 2 n8n workflow updates to `outreach_sent`
- Future follow-up tracking uses `follow_up` and `completed`

---

#### 2. Primary Contact Consultant Flag
```sql
contact_is_consultant boolean DEFAULT false NOT NULL
```

**Purpose:** Tag the primary contact as a consultant

**Usage in UI:**
- "Tag as Consultant" button in primary contact section
- Toggles between `true` and `false`
- Affects email routing in Part 2 workflow (different template for consultants)

---

#### 3. Mail Contact Consultant Flag
```sql
mail_contact_is_consultant boolean DEFAULT false NOT NULL
```

**Purpose:** Tag the USAC mail contact as a consultant

**Usage in UI:**
- "Tag as Consultant" button in mail contact section
- Toggles between `true` and `false`
- Allows independent tagging from primary contact

---

### Indexes Created

```sql
-- For filtering by outreach status
CREATE INDEX clinics_outreach_status_idx
  ON public.clinics_pending_review(outreach_status)
  WHERE NOT processed;

-- For filtering by consultant contacts
CREATE INDEX clinics_consultant_contacts_idx
  ON public.clinics_pending_review(mail_contact_is_consultant, contact_is_consultant)
  WHERE NOT processed;
```

**Rationale:** Improve query performance for dashboard filters

---

## TypeScript Type Updates

Updated `database.types.ts` to include the new fields:

### Row Type
```typescript
outreach_status: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
contact_is_consultant: boolean
mail_contact_is_consultant: boolean
```

### Insert Type
```typescript
outreach_status?: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
contact_is_consultant?: boolean
mail_contact_is_consultant?: boolean
```

### Update Type
```typescript
outreach_status?: 'pending' | 'ready_for_outreach' | 'outreach_sent' | 'follow_up' | 'completed'
contact_is_consultant?: boolean
mail_contact_is_consultant?: boolean
```

---

## Migration Steps

1. **Run Migration SQL**
   ```bash
   # Apply the migration to Supabase
   psql -h [SUPABASE_HOST] -U postgres -d postgres -f database/migrations/20251109_add_outreach_and_consultant_fields.sql
   ```

   OR via Supabase Dashboard:
   - Go to SQL Editor
   - Paste contents of `20251109_add_outreach_and_consultant_fields.sql`
   - Execute

2. **Verify Migration**
   ```sql
   -- Check columns were added
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'clinics_pending_review'
   AND column_name IN ('outreach_status', 'contact_is_consultant', 'mail_contact_is_consultant');

   -- Check indexes were created
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'clinics_pending_review'
   AND indexname IN ('clinics_outreach_status_idx', 'clinics_consultant_contacts_idx');
   ```

3. **Update Existing Records** (if needed)
   ```sql
   -- Set default values for existing records
   UPDATE public.clinics_pending_review
   SET
     outreach_status = 'pending',
     contact_is_consultant = false,
     mail_contact_is_consultant = false
   WHERE outreach_status IS NULL;
   ```

---

## API Changes Required

### New API Routes

1. **Start Outreach**
   - Path: `/api/clinics/[id]/start-outreach`
   - Method: `POST`
   - Action: Update `outreach_status` to `'ready_for_outreach'`

2. **Tag Primary Contact as Consultant**
   - Path: `/api/clinics/[id]/tag-primary-consultant`
   - Method: `POST`
   - Action: Toggle `contact_is_consultant`

3. **Tag Mail Contact as Consultant**
   - Path: `/api/clinics/[id]/tag-mail-consultant`
   - Method: `POST`
   - Action: Toggle `mail_contact_is_consultant`

---

## UI Changes Summary

1. **Remove Application Type Filter** ✓
2. **Add "Start Outreach" Button** - Uses `outreach_status` field
3. **Add Service Type Modal** - No DB changes needed
4. **Add "Tag as Consultant" Buttons** - Uses consultant boolean fields

---

## Backward Compatibility

- All new fields have default values
- Existing queries will continue to work
- No breaking changes to existing API endpoints
- Migration is safe to run on production

---

## Testing Checklist

- [ ] Migration runs successfully on development database
- [ ] All new columns present with correct types and constraints
- [ ] Indexes created successfully
- [ ] TypeScript types compile without errors
- [ ] Existing clinics display correctly with new defaults
- [ ] API routes update fields correctly
- [ ] Dashboard filters work with new fields
- [ ] n8n workflow can read `outreach_status` field
- [ ] Consultant tagging affects workflow routing as expected

---

## Rollback Plan

If issues arise, rollback with:

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

## Questions for Review

1. **Outreach Status Values**: Do we need additional states? (e.g., `on_hold`, `declined`)
2. **Consultant Detection**: Should we auto-detect consultants based on email domain or org name patterns?
3. **Workflow Integration**: Should Part 2 workflow also update the `processed` field when `outreach_status` reaches `completed`?
4. **Dashboard Filtering**: Should we add a filter for outreach status in the UI?

---

**Files Modified:**
- `database/migrations/20251109_add_outreach_and_consultant_fields.sql` (new)
- `dashboard/src/types/database.types.ts` (updated)

**Files To Create:**
- API routes for outreach status and consultant tagging
- UI components for new buttons and modals
