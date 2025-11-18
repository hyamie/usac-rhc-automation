# Clinic Grouping Feature

## Overview
Allows manual grouping of multiple clinic records (with different HCP numbers) into a single grouped card. This is useful when a single organization files separate HCP applications for each location.

## Files Created

### Frontend Components
1. **`dashboard/src/components/ui/checkbox.tsx`** - Radix UI checkbox component
2. **`dashboard/src/components/ui/label.tsx`** - Radix UI label component
3. **`dashboard/src/contexts/ClinicSelectionContext.tsx`** - React context for managing clinic selection state
4. **`dashboard/src/components/clinics/SelectionToolbar.tsx`** - Sticky toolbar showing selected clinics with "Group" button
5. **`dashboard/src/components/clinics/CreateGroupModal.tsx`** - Modal for creating clinic groups

### Backend API
6. **`dashboard/src/app/api/clinic-groups/route.ts`** - API routes for creating and fetching clinic groups

### Database
7. **`database/migrations/002_clinic_groups.sql`** - Database schema for clinic groups

### Modified Files
8. **`dashboard/src/components/clinics/ClinicCard.tsx`** - Added checkbox for selection
9. **`dashboard/src/components/clinics/ClinicList.tsx`** - Wrapped in selection provider, added toolbar

## How It Works

### 1. Selection Phase
- Each clinic card now has a checkbox in the top-left corner
- Click checkboxes to select multiple clinics
- Selected cards get a blue ring highlight
- Selection state managed by React Context

### 2. Selection Toolbar
When 2+ clinics are selected, a sticky toolbar appears showing:
- Number of clinics selected
- Total combined funding
- "Group Selected Clinics" button
- "Clear Selection" button

### 3. Group Creation Modal
Clicking "Group Selected Clinics" opens a modal with:
- **Group Name Input** - Name for the grouped entity
- **Primary Contact Selection** - Dropdown to choose which clinic's contact info to use
- **Selected Clinics List** - Scrollable list showing:
  - Clinic name
  - Location (city, state)
  - HCP number
  - Individual funding amount
  - Primary badge on selected primary clinic
- **Summary Stats**:
  - Total Group Funding
  - Total Locations

### 4. Database Storage
When "Create Group" is clicked:

1. **clinic_groups** table entry created:
   - group_name
   - primary_clinic_id
   - total_funding_amount (sum)
   - location_count

2. **clinic_group_members** entries created:
   - Links each selected clinic to the group

3. **clinics_pending_review** updated:
   - Each clinic's `belongs_to_group_id` set to new group ID

### 5. Display (Future Enhancement)
After grouping, the dashboard should show:
- One grouped card instead of multiple individual cards
- Similar to HCP aggregation, but for manually grouped clinics
- Badge showing "X Locations"
- Combined funding totals by fiscal year
- Dropdown to view individual member locations

## Database Schema

### clinic_groups
```sql
id UUID PRIMARY KEY
group_name TEXT NOT NULL
primary_clinic_id UUID REFERENCES clinics_pending_review(id)
total_funding_amount NUMERIC(12,2)
location_count INTEGER
created_by TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### clinic_group_members
```sql
id UUID PRIMARY KEY
group_id UUID REFERENCES clinic_groups(id) ON DELETE CASCADE
clinic_id UUID REFERENCES clinics_pending_review(id) ON DELETE CASCADE
added_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(group_id, clinic_id)
```

### clinics_pending_review (new column)
```sql
belongs_to_group_id UUID REFERENCES clinic_groups(id) ON DELETE SET NULL
```

## Installation Steps

### 1. Install NPM Dependencies
```bash
cd dashboard
npm install @radix-ui/react-checkbox @radix-ui/react-label class-variance-authority
```

### 2. Run Database Migration
Option A: Via Supabase SQL Editor
1. Go to https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new
2. Copy contents of `database/migrations/002_clinic_groups.sql`
3. Paste and run

Option B: Via command line (if Supabase CLI installed)
```bash
supabase db push --db-url "postgresql://postgres:[password]@db.fhuqiicgmfpnmficopqp.supabase.co:5432/postgres"
```

### 3. Test the Feature
1. Start dev server: `npm run dev`
2. Navigate to dashboard
3. Select 2+ clinic cards using checkboxes
4. Click "Group Selected Clinics"
5. Fill in group name and select primary contact
6. Click "Create Group"
7. Refresh page to see result

## API Endpoints

### POST /api/clinic-groups
Create a new clinic group

**Request Body:**
```json
{
  "group_name": "Regional Medical Group",
  "primary_clinic_id": "uuid-of-primary-clinic",
  "clinic_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "group": {
    "id": "group-uuid",
    "group_name": "Regional Medical Group",
    "total_funding_amount": 182450.00,
    "location_count": 3
  },
  "members_added": 3
}
```

### GET /api/clinic-groups
Fetch all clinic groups or a specific group

**Query Parameters:**
- `group_id` (optional) - UUID of specific group to fetch

**Response (all groups):**
```json
{
  "groups": [
    {
      "id": "uuid",
      "group_name": "Regional Medical Group",
      "total_funding_amount": 182450.00,
      "location_count": 3,
      "created_at": "2025-11-17T...",
      "primary_clinic": {
        "clinic_name": "Regional Medical Center",
        "city": "Denver",
        "state": "CO"
      }
    }
  ]
}
```

## Future Enhancements

1. **Grouped Card Display Logic**
   - Modify `aggregateClinicsByHCP` to also aggregate by `belongs_to_group_id`
   - Show grouped clinics similar to HCP-aggregated clinics
   - Add "Ungroup" functionality

2. **Edit Groups**
   - Add/remove clinics from existing groups
   - Change primary contact
   - Rename group

3. **Delete Groups**
   - Ungroup all members
   - Delete group record

4. **Bulk Actions**
   - "Mark as processed" for entire group
   - "Start outreach" for entire group (sends to all members)

5. **Group Templates**
   - Save commonly used groupings
   - Quick-apply templates to new filings

## Testing Checklist

- [ ] Select 2+ clinics, toolbar appears
- [ ] Toolbar shows correct clinic count
- [ ] Toolbar shows correct total funding
- [ ] Clear selection works
- [ ] Modal opens with correct clinics listed
- [ ] Group name validation works
- [ ] Primary contact selection required
- [ ] API creates group successfully
- [ ] Database records created correctly
- [ ] Page refresh shows updated data
- [ ] Grouped clinics have `belongs_to_group_id` set
- [ ] Selection state clears after group creation

## Troubleshooting

### Checkboxes not appearing
- Verify `@radix-ui/react-checkbox` is installed
- Check browser console for import errors

### API errors on group creation
- Verify database migration ran successfully
- Check Supabase logs for SQL errors
- Ensure RLS policies allow inserts

### Groups not persisting
- Check network tab for failed API calls
- Verify Supabase connection string in .env.local
- Check database for successful inserts

### Selection state not working
- Ensure ClinicList is wrapped in `<ClinicSelectionProvider>`
- Check React DevTools for context provider
