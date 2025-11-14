# ABC Routing Implementation Guide

## Overview

This guide walks through implementing the multi-dimensional email routing system (ABC Routes) for USAC RHC outreach automation.

**Estimated Time**: 2-3 hours
**Complexity**: Medium
**Risk Level**: Low (additive changes, backward compatible)

---

## Prerequisites

- [ ] Access to Supabase SQL Editor (fhuqiicgmfpnmficopqp project)
- [ ] Access to n8n workflow editor (hyamie.app.n8n.cloud)
- [ ] Access to Vercel dashboard deployment
- [ ] Local development environment for dashboard testing

---

## Phase 1: Database Migration (30 minutes)

### Step 1.1: Run Migration Script

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql

2. Copy contents of `database/migrations/add_abc_routing_fields.sql`

3. Execute the migration script

4. Verify new columns exist:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'clinics_pending_review'
     AND column_name IN (
       'requested_service_category',
       'funding_threshold',
       'total_3yr_funding',
       'abc_route_assignment',
       'route_reasoning'
     );
   ```

5. Check indexes were created:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'clinics_pending_review'
     AND indexname IN ('clinics_abc_route_idx', 'clinics_service_funding_idx');
   ```

### Step 1.2: Verify Backfill

Check that existing records were backfilled with default values:

```sql
-- Check route distribution
SELECT abc_route_assignment, COUNT(*) as count
FROM clinics_pending_review
GROUP BY abc_route_assignment
ORDER BY count DESC;

-- Check service category distribution
SELECT requested_service_category, COUNT(*) as count
FROM clinics_pending_review
GROUP BY requested_service_category
ORDER BY count DESC;

-- Check funding threshold distribution
SELECT funding_threshold, COUNT(*) as count
FROM clinics_pending_review
GROUP BY funding_threshold
ORDER BY count DESC;
```

Expected: All existing records should show `unassigned` or `unknown` values.

### Step 1.3: Regenerate TypeScript Types

From dashboard directory:

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation\dashboard

npx supabase gen types typescript --project-id fhuqiicgmfpnmficopqp > src/types/database.types.ts
```

Verify new fields appear in generated types:

```typescript
// Should see these new fields in clinics_pending_review Row type:
requested_service_category: string | null
funding_threshold: string | null
total_3yr_funding: number | null
abc_route_assignment: string | null
route_reasoning: string | null
```

---

## Phase 2: n8n Workflow Updates (60 minutes)

### Step 2.1: Update Main Daily Workflow

**Workflow**: `USAC RHC - Main Daily Workflow V2`

#### 2.1.1: Update "Process & Extract All Fields" Node

1. Open workflow in n8n editor
2. Find node: **"Process & Extract All Fields"**
3. Replace JavaScript code with: `workflows/n8n_code_snippets/parse_service_category.js`
4. Save node

#### 2.1.2: Update "Calculate Priority & Merge Data" Node

1. Find node: **"Calculate Priority & Merge Data"**
2. Replace JavaScript code with: `workflows/n8n_code_snippets/calculate_funding_threshold.js`
3. Save node

#### 2.1.3: Add New "Assign ABC Route" Node

1. Click **+** after "Calculate Priority & Merge Data" node
2. Add new **Code** node
3. Name it: **"Assign ABC Route"**
4. Paste code from: `workflows/n8n_code_snippets/assign_abc_route.js`
5. Connect to "Calculate Priority & Merge Data" output
6. Connect output to existing "Insert into Supabase" node
7. Save workflow

#### 2.1.4: Test Workflow with Sample Data

1. Use existing Pin Data or add test data:
   ```json
   {
     "hcp_number": "TEST001",
     "clinic_name": "Test Clinic",
     "service_type": "Voice",
     "is_consultant": false,
     "funding_amount_1": 120000,
     "funding_amount_2": 80000,
     "funding_amount_3": 50000
   }
   ```

2. Execute workflow manually
3. Check output of "Assign ABC Route" node
4. Expected output should include:
   - `requested_service_category`: "voice"
   - `funding_threshold`: "high"
   - `total_3yr_funding`: 250000
   - `abc_route_assignment`: "route_a"
   - `route_reasoning`: "Premium Route: Direct contact..."

### Step 2.2: Update Enrichment Sub-Workflow

**Workflow**: `USAC RHC - Enrichment Sub-Workflow V2`

#### 2.2.1: Update "Determine Contact Type" Node

Add ABC routing fields to the contact determination:

```javascript
// Existing code...
return {
  json: {
    ...clinic,
    email_template_type: clinic.abc_route_assignment === 'route_a' ? 'premium' :
                         clinic.abc_route_assignment === 'route_b' ? 'standard' :
                         clinic.abc_route_assignment === 'route_c' ? 'light_touch' :
                         (clinic.is_consultant ? 'consultant' : 'direct'), // fallback
    addressee_name: clinic.contact_name || clinic.mail_contact_name,
    addressee_email: clinic.contact_email || clinic.mail_contact_email,
    addressee_company: clinic.is_consultant ? (clinic.consultant_company || clinic.mail_contact_company) : clinic.clinic_name
  }
};
```

#### 2.2.2: Update "Claude Sonnet - Generate Email" Node

Modify the prompt to include ABC routing context:

```javascript
// In prompt parameter, add these lines:
Route Assignment: {{$json.abc_route_assignment}}
Routing Reason: {{$json.route_reasoning}}
Service Category: {{$json.requested_service_category}}
Funding Threshold: {{$json.funding_threshold}}
Total 3-Year Funding: ${{$json.total_3yr_funding}}

// Then reference the appropriate template:
{{#if $json.abc_route_assignment === 'route_a'}}
Use the PREMIUM email template (Route A) with:
- Consultative, executive-level tone
- Direct phone number and personalized approach
- Emphasis on white-glove service and custom solutions
{{else if $json.abc_route_assignment === 'route_b'}}
Use the STANDARD email template (Route B) with:
- Professional, feature-focused tone
- ROI and cost savings emphasis
- Case studies and testimonials
{{else}}
Use the LIGHT-TOUCH email template (Route C) with:
- Brief, informational tone
- Educational resources and self-service options
- Low-pressure call-to-action
{{/if}}
```

Alternatively, create 3 separate Claude nodes (one per route) and use an IF node to route to the appropriate template.

#### 2.2.3: Test Enrichment Workflow

1. Trigger webhook with test clinic ID
2. Verify email template matches route assignment
3. Check that route reasoning appears in generated email context

---

## Phase 3: Dashboard Updates (45 minutes)

### Step 3.1: Update ClinicCard Component

Add route badge display in `dashboard/src/components/clinics/ClinicCard.tsx`:

```typescript
// After funding_year badge (around line 136), add:
{clinic.abc_route_assignment && clinic.abc_route_assignment !== 'unassigned' && (
  <Badge
    variant={
      clinic.abc_route_assignment === 'route_a' ? 'default' :
      clinic.abc_route_assignment === 'route_b' ? 'secondary' :
      'outline'
    }
    className={
      clinic.abc_route_assignment === 'route_a' ? 'bg-purple-600 dark:bg-purple-700 text-white' :
      clinic.abc_route_assignment === 'route_b' ? 'bg-blue-600 dark:bg-blue-700 text-white' :
      'border-gray-400 text-gray-700 dark:text-gray-300'
    }
  >
    {clinic.abc_route_assignment === 'route_a' && '🔥 Premium'}
    {clinic.abc_route_assignment === 'route_b' && '📊 Standard'}
    {clinic.abc_route_assignment === 'route_c' && '📝 Light'}
  </Badge>
)}
```

### Step 3.2: Add Route Filter Component

Create new filter: `dashboard/src/components/filters/RouteFilter.tsx`

```typescript
'use client';

import React from 'react';
import { Tag } from 'lucide-react';

type RouteFilterValue = 'all' | 'route_a' | 'route_b' | 'route_c' | 'unassigned';

interface RouteFilterProps {
  value: RouteFilterValue;
  onChange: (value: RouteFilterValue) => void;
  className?: string;
}

const ROUTE_OPTIONS = [
  { value: 'all', label: 'All Routes', icon: '🎯' },
  { value: 'route_a', label: 'Premium (A)', icon: '🔥' },
  { value: 'route_b', label: 'Standard (B)', icon: '📊' },
  { value: 'route_c', label: 'Light-Touch (C)', icon: '📝' },
  { value: 'unassigned', label: 'Unassigned', icon: '❓' },
];

export function RouteFilter({ value, onChange, className = '' }: RouteFilterProps) {
  const currentOption = ROUTE_OPTIONS.find(opt => opt.value === value);

  return (
    <div className={`flex gap-2 ${className}`}>
      {ROUTE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value as RouteFilterValue)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm
            ${value === option.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent border-border'
            }
          `}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### Step 3.3: Update ClinicList Component

Add route filter to `dashboard/src/components/clinics/ClinicList.tsx`:

```typescript
// Import new filter
import { RouteFilter } from '@/components/filters/RouteFilter';

// Add state
const [routeFilter, setRouteFilter] = useState<'all' | 'route_a' | 'route_b' | 'route_c' | 'unassigned'>('all');

// Add filter handler
const handleRouteFilterChange = (value: 'all' | 'route_a' | 'route_b' | 'route_c' | 'unassigned') => {
  setRouteFilter(value);
  setFilters((prev) => ({
    ...prev,
    abc_route_assignment: value === 'all' ? undefined : value,
  }));
};

// Add to filters section (after ServiceTypeFilter)
<RouteFilter
  value={routeFilter}
  onChange={handleRouteFilterChange}
/>
```

### Step 3.4: Update use-clinics Hook

Update filter query in `dashboard/src/hooks/use-clinics.ts`:

```typescript
export interface ClinicFilters {
  state?: string
  funding_year?: string
  application_type?: string
  service_type?: string
  abc_route_assignment?: string  // NEW
  processed?: boolean | 'has_notes'
  dateFrom?: string
  dateTo?: string
}

// In query builder:
if (filters.abc_route_assignment) {
  query = query.eq('abc_route_assignment', filters.abc_route_assignment)
}
```

### Step 3.5: Add Route Details Modal (Optional Enhancement)

Add a modal to show detailed routing reasoning in ClinicCard:

```typescript
// Add button to show route reasoning
{clinic.route_reasoning && (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-xs">
        <Info className="h-3 w-3 mr-1" />
        Why this route?
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Route Assignment Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 text-sm">
        <p><strong>Route:</strong> {clinic.abc_route_assignment}</p>
        <p><strong>Reasoning:</strong> {clinic.route_reasoning}</p>
        <p><strong>Service Category:</strong> {clinic.requested_service_category}</p>
        <p><strong>Funding Threshold:</strong> {clinic.funding_threshold}</p>
        <p><strong>3-Year Funding:</strong> ${clinic.total_3yr_funding?.toLocaleString()}</p>
      </div>
    </DialogContent>
  </Dialog>
)}
```

### Step 3.6: Build and Test Dashboard

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation\dashboard

# Install dependencies if needed
npm install

# Run development server
npm run dev

# Test:
# 1. Check that route badges appear on clinic cards
# 2. Test route filter functionality
# 3. Verify route details modal displays correctly
# 4. Check TypeScript compilation (no errors)
```

---

## Phase 4: Testing & Validation (30 minutes)

### Test Case 1: Route A (Premium)
```sql
-- Create test record
INSERT INTO clinics_pending_review (
  hcp_number, clinic_name, city, state, filing_date,
  form_465_hash, service_type, requested_service_category,
  is_consultant, funding_amount_1, funding_amount_2, funding_amount_3,
  total_3yr_funding, funding_threshold
) VALUES (
  'TEST_ROUTE_A', 'Premium Medical Center', 'Helena', 'MT', NOW(),
  'test_hash_route_a', 'Voice Services', 'voice',
  false, 120000, 80000, 50000,
  250000, 'high'
);
```

Run n8n workflow → Verify:
- [ ] `abc_route_assignment` = 'route_a'
- [ ] `route_reasoning` contains "Premium Route"
- [ ] Email template uses premium tone
- [ ] Dashboard shows 🔥 Premium badge

### Test Case 2: Route B (Standard)
```sql
INSERT INTO clinics_pending_review (
  hcp_number, clinic_name, city, state, filing_date,
  form_465_hash, service_type, requested_service_category,
  is_consultant, funding_amount_1, funding_amount_2, funding_amount_3,
  total_3yr_funding, funding_threshold
) VALUES (
  'TEST_ROUTE_B', 'Community Health Clinic', 'Missoula', 'MT', NOW(),
  'test_hash_route_b', 'Data Services', 'data',
  false, 40000, 30000, 20000,
  90000, 'medium'
);
```

Verify:
- [ ] `abc_route_assignment` = 'route_b'
- [ ] Email uses standard professional tone
- [ ] Dashboard shows 📊 Standard badge

### Test Case 3: Route C (Light-Touch)
```sql
INSERT INTO clinics_pending_review (
  hcp_number, clinic_name, city, state, filing_date,
  form_465_hash, service_type, requested_service_category,
  is_consultant, funding_amount_1, funding_amount_2, funding_amount_3,
  total_3yr_funding, funding_threshold
) VALUES (
  'TEST_ROUTE_C', 'Small Rural Clinic', 'Butte', 'MT', NOW(),
  'test_hash_route_c', 'Other', 'other',
  true, 0, 0, 0,
  0, 'unknown'
);
```

Verify:
- [ ] `abc_route_assignment` = 'route_c'
- [ ] Email uses brief informational tone
- [ ] Dashboard shows 📝 Light badge

---

## Phase 5: Deployment (15 minutes)

### Step 5.1: Deploy Dashboard to Vercel

```bash
cd C:\ClaudeAgents\projects\usac-rhc-automation\dashboard

# Commit changes
git add .
git commit -m "feat: Add ABC routing system with multi-dimensional email targeting"

# Push to trigger Vercel deployment
git push origin main
```

Monitor deployment at: https://vercel.com/dashboard

### Step 5.2: Activate n8n Workflows

1. Open n8n: https://hyamie.app.n8n.cloud
2. Set workflows to **Active**:
   - USAC RHC - Main Daily Workflow V2
   - USAC RHC - Enrichment Sub-Workflow V2
3. Verify schedule triggers are enabled

### Step 5.3: Monitor First Run

1. Wait for next scheduled run (or trigger manually)
2. Check Supabase for new records with ABC routing fields populated
3. Verify dashboard displays route badges correctly
4. Check email drafts have appropriate templates

---

## Rollback Plan

If issues arise:

### Database Rollback
```sql
-- Remove new columns (data will be lost!)
ALTER TABLE clinics_pending_review
DROP COLUMN IF EXISTS requested_service_category,
DROP COLUMN IF EXISTS funding_threshold,
DROP COLUMN IF EXISTS total_3yr_funding,
DROP COLUMN IF EXISTS abc_route_assignment,
DROP COLUMN IF EXISTS route_reasoning;
```

### n8n Rollback
1. Revert to previous workflow version
2. Remove "Assign ABC Route" node
3. Restore original "Process & Extract All Fields" code

### Dashboard Rollback
```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

- [ ] All database migrations executed successfully
- [ ] TypeScript types regenerated with new fields
- [ ] n8n workflows updated and tested
- [ ] Dashboard displays route badges and filters
- [ ] Test clinics assigned correct routes
- [ ] Email templates use route-specific content
- [ ] No errors in Supabase logs
- [ ] No errors in Vercel deployment logs
- [ ] No TypeScript compilation errors

---

## Post-Deployment Monitoring

### Week 1: Monitor and Adjust

Track these metrics in first week:

```sql
-- Route distribution
SELECT
  abc_route_assignment,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM clinics_pending_review
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY abc_route_assignment;

-- Service category accuracy
SELECT
  service_type,
  requested_service_category,
  COUNT(*) as count
FROM clinics_pending_review
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type, requested_service_category
ORDER BY count DESC
LIMIT 20;

-- Funding threshold distribution
SELECT
  funding_threshold,
  AVG(total_3yr_funding) as avg_funding,
  MIN(total_3yr_funding) as min_funding,
  MAX(total_3yr_funding) as max_funding,
  COUNT(*) as count
FROM clinics_pending_review
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY funding_threshold;
```

Expected distribution:
- Route A: 15-25% (premium tier)
- Route B: 40-50% (standard tier)
- Route C: 25-35% (light-touch tier)

If distribution is skewed, adjust thresholds in `assign_abc_route.js`.

---

## Troubleshooting

### Issue: All clinics assigned Route C

**Cause**: Funding amounts not being calculated properly

**Fix**: Check "Calculate Priority & Merge Data" node output

### Issue: Service category always "unknown"

**Cause**: service_type field name mismatch or empty data

**Fix**: Check USAC API field mapping in "Process & Extract All Fields"

### Issue: Dashboard not showing route badges

**Cause**: TypeScript types not regenerated or component not updated

**Fix**: Regenerate types and verify ClinicCard.tsx changes deployed

---

## Support

For questions or issues:
- Check logs in Supabase: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/logs
- Check n8n execution logs: https://hyamie.app.n8n.cloud/executions
- Check Vercel deployment logs: https://vercel.com/dashboard

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Estimated Implementation Time**: 2-3 hours
