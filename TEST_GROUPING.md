# Test Clinic Grouping Feature

## What Was Updated

✅ **Database Migration** - Ran successfully (you confirmed)
✅ **TypeScript Types** - Added `belongs_to_group_id`, `clinic_groups`, `clinic_group_members`
✅ **Aggregation Logic** - Now groups by manual groups OR HCP number
✅ **All UI Components** - Checkboxes, toolbar, modal ready

## How to Test

### 1. Start the Dev Server
```bash
cd dashboard
npm run dev
```

Open: http://localhost:3000

### 2. Select Multiple Clinics
1. Look for clinic cards on the homepage
2. Click the **checkbox** in the top-left of 2+ different clinic cards
3. Selected cards should get a **blue ring** highlight

### 3. Verify Selection Toolbar Appears
When 2+ clinics are selected, you should see a sticky toolbar at the top with:
- "X Clinics Selected"
- "Total Funding: $XXX,XXX"
- "Group Selected Clinics" button
- "Clear Selection" button

### 4. Create a Group
1. Click **"Group Selected Clinics"** button
2. A modal should open showing:
   - Group name input (pre-filled suggestion)
   - Primary contact dropdown
   - List of selected clinics with details
   - Total funding summary
3. Enter a group name (e.g., "Test Regional Group")
4. Select a primary clinic from dropdown
5. Click **"Create Group"**

### 5. Verify Group Creation
After clicking "Create Group":
- Success toast notification should appear
- Page should refresh automatically
- The grouped clinics should now appear as **ONE CARD** instead of multiple

### 6. Verify Grouped Card Display
The grouped card should show:
- Combined clinic name
- Badge showing "X Applications" or "X Locations"
- Combined funding totals
- Locations dropdown (click to see all member locations)

## Expected Behavior

### Before Grouping
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Regional Med 1  │  │ Regional Med 2  │  │ Regional Med 3  │
│ HCP 27206       │  │ HCP 28150       │  │ HCP 29033       │
│ $45,000         │  │ $38,200         │  │ $52,100         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### After Grouping
```
┌────────────────────────────────────────────┐
│ Test Regional Group                        │
│ 3 Locations Badge                          │
│ Total: $135,300                            │
│ ▼ Show All Locations                       │
└────────────────────────────────────────────┘
```

## Troubleshooting

### Checkboxes Not Showing
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors
- Verify NPM packages installed: `npm list @radix-ui/react-checkbox`

### Toolbar Not Appearing
- Try selecting 2+ clinics
- Check browser console for React errors
- Ensure you're on the main clinic list page

### API Errors
1. Open browser DevTools → Network tab
2. Try creating a group
3. Look for `/api/clinic-groups` request
4. Check response for error details

Common issues:
- **401/403**: Authentication/permission error in Supabase
- **500**: Database constraint violation
- **400**: Missing required fields

### Groups Not Persisting
1. Check Network tab for successful POST
2. Verify in Supabase:
   ```sql
   SELECT * FROM clinic_groups ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM clinic_group_members ORDER BY added_at DESC LIMIT 10;
   ```
3. Check if `belongs_to_group_id` was set:
   ```sql
   SELECT id, clinic_name, belongs_to_group_id
   FROM clinics_pending_review
   WHERE belongs_to_group_id IS NOT NULL;
   ```

### Grouped Cards Not Appearing
- Refresh the page (F5)
- Check if `aggregateClinicsByHCP()` is being called
- Verify the aggregation logic includes manual groups
- Check browser console for aggregation errors

## Success Criteria

✅ Checkboxes appear on all clinic cards
✅ Clicking checkbox toggles blue ring highlight
✅ Toolbar appears when 2+ selected
✅ Toolbar shows correct count and funding total
✅ "Clear Selection" clears all checkboxes
✅ "Group Selected Clinics" opens modal
✅ Modal shows all selected clinics
✅ Primary contact dropdown works
✅ "Create Group" button submits successfully
✅ Success toast appears
✅ Page refreshes after group creation
✅ Grouped clinics show as ONE card
✅ Grouped card shows combined funding
✅ Grouped card shows location count badge

## Next Steps After Testing

Once grouping works:
1. **Phase 2**: Create email template database schema
2. **Phase 3**: Build template selection modal
3. **Phase 4**: Q&A session for template content
