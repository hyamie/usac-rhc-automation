# Funding History Location Enhancement - Code Changes

## Overview
Add service delivery site location data to the Funding History display by enhancing the Commitments & Disbursements API query.

---

## CURRENT STATE (What's Working Now)

### Current n8n Node: "GET Historical Funding Data"
**Query Parameters:**
```
$where: filing_hcp='{{ $json.hcp_number }}' AND funding_year IN ('2023','2024','2025')
$select: funding_year,original_requested_amount
$order: funding_year DESC
$limit: 3
```

**Current Response Format (Example):**
```json
[
  {"funding_year": "2025", "original_requested_amount": "52100"},
  {"funding_year": "2024", "original_requested_amount": "38200"},
  {"funding_year": "2023", "original_requested_amount": "45000"}
]
```

**Current Database Storage (`historical_funding` column):**
```json
[
  {"year": "2025", "amount": 52100},
  {"year": "2024", "amount": 38200},
  {"year": "2023", "amount": 45000}
]
```

**Current Display:**
```
Funding History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025    $52,100
2024    $38,200
2023    $45,000
```

---

## PROPOSED CHANGES

### CHANGE #1: n8n "GET Historical Funding Data" Node

**NEW Query Parameters:**
```
$where: filing_hcp='{{ $json.hcp_number }}' AND funding_year IN ('2023','2024','2025')
$select: funding_year,funding_request_number,original_requested_amount,participating_hcp_name,participating_hcp_street,participating_hcp_city,participating_hcp_state,participating_hcp_zip_code
$order: funding_year DESC,funding_request_number ASC
$limit: 50
```

**Why These Changes:**
- Added `funding_request_number` - Unique ID for each funding request (like application number)
- Added `participating_hcp_name` - Name of service delivery site location
- Added `participating_hcp_street` - Street address of service delivery site
- Added `participating_hcp_city` - City of service delivery site
- Added `participating_hcp_state` - State of service delivery site
- Added `participating_hcp_zip_code` - ZIP code of service delivery site
- Changed `$limit` from 3 to 50 - Because one HCP can have multiple service delivery sites per year
- Added `funding_request_number ASC` to $order - Groups locations within each year

**NEW Response Format (Example with Multiple Locations):**
```json
[
  {
    "funding_year": "2025",
    "funding_request_number": "5010001234",
    "original_requested_amount": "25000",
    "participating_hcp_name": "Regional Medical Center",
    "participating_hcp_street": "123 Main St",
    "participating_hcp_city": "Denver",
    "participating_hcp_state": "CO",
    "participating_hcp_zip_code": "80202"
  },
  {
    "funding_year": "2025",
    "funding_request_number": "5010001235",
    "original_requested_amount": "27100",
    "participating_hcp_name": "Regional Medical - East Campus",
    "participating_hcp_street": "456 Oak Ave",
    "participating_hcp_city": "Aurora",
    "participating_hcp_state": "CO",
    "participating_hcp_zip_code": "80012"
  },
  {
    "funding_year": "2024",
    "funding_request_number": "5010001100",
    "original_requested_amount": "38200",
    "participating_hcp_name": "Regional Medical Center",
    "participating_hcp_street": "123 Main St",
    "participating_hcp_city": "Denver",
    "participating_hcp_state": "CO",
    "participating_hcp_zip_code": "80202"
  }
]
```

---

### CHANGE #2: n8n Data Processing Node

**Current Node Name:** "Calculate Priority & Merge Data" or "Format Historical Funding"

**BEFORE (Current Code - What's Working):**
Find the code section that processes historical funding. It likely looks like:
```javascript
// Current working code structure
const historicalFunding = historicalData.map(item => ({
  year: item.funding_year,
  amount: parseFloat(item.original_requested_amount || 0)
}));
```

**AFTER (New Code):**
```javascript
// Group by year and aggregate locations
const fundingByYear = {};

historicalData.forEach(item => {
  const year = item.funding_year;
  const amount = parseFloat(item.original_requested_amount || 0);

  if (!fundingByYear[year]) {
    fundingByYear[year] = {
      year: year,
      totalAmount: 0,
      locations: []
    };
  }

  fundingByYear[year].totalAmount += amount;
  fundingByYear[year].locations.push({
    frn: item.funding_request_number,
    amount: amount,
    name: item.participating_hcp_name || 'Unknown Location',
    street: item.participating_hcp_street || '',
    city: item.participating_hcp_city || '',
    state: item.participating_hcp_state || '',
    zip: item.participating_hcp_zip_code || ''
  });
});

// Convert to array format
const historicalFunding = Object.values(fundingByYear).map(yearData => ({
  year: yearData.year,
  amount: yearData.totalAmount,
  locations: yearData.locations
}));
```

**NEW Database Storage Format (`historical_funding` column):**
```json
[
  {
    "year": "2025",
    "amount": 52100,
    "locations": [
      {
        "frn": "5010001234",
        "amount": 25000,
        "name": "Regional Medical Center",
        "street": "123 Main St",
        "city": "Denver",
        "state": "CO",
        "zip": "80202"
      },
      {
        "frn": "5010001235",
        "amount": 27100,
        "name": "Regional Medical - East Campus",
        "street": "456 Oak Ave",
        "city": "Aurora",
        "state": "CO",
        "zip": "80012"
      }
    ]
  },
  {
    "year": "2024",
    "amount": 38200,
    "locations": [
      {
        "frn": "5010001100",
        "amount": 38200,
        "name": "Regional Medical Center",
        "street": "123 Main St",
        "city": "Denver",
        "state": "CO",
        "zip": "80202"
      }
    ]
  }
]
```

---

### CHANGE #3: TypeScript Types

**File:** `dashboard/src/types/database.types.ts`

**BEFORE (Current Code - Lines 307-311):**
```typescript
// Helper type for historical funding array items
export interface HistoricalFundingItem {
  year: string
  amount: number
}
```

**AFTER (New Code):**
```typescript
// Helper type for location within funding year
export interface FundingLocation {
  frn: string           // Funding Request Number
  amount: number        // Amount for this specific location
  name: string          // Service delivery site name
  street: string        // Service delivery site street
  city: string          // Service delivery site city
  state: string         // Service delivery site state
  zip: string           // Service delivery site ZIP code
}

// Helper type for historical funding array items
export interface HistoricalFundingItem {
  year: string
  amount: number
  locations?: FundingLocation[]  // Optional for backward compatibility
}
```

---

### CHANGE #4: FundingHistory Component UI

**File:** `dashboard/src/components/clinics/FundingHistory.tsx`

**BEFORE (Current Display - Lines 30-39):**
```typescript
// Aggregate funding by year (handles duplicates)
const aggregatedByYear: { [year: string]: number } = {}
Object.entries(props.aggregatedFunding || {}).forEach(([year, amount]) => {
  if (!aggregatedByYear[year]) {
    aggregatedByYear[year] = 0
  }
  aggregatedByYear[year] += amount
})

const sortedYears = Object.keys(aggregatedByYear).sort()
```

**AFTER (New Display with Expandable Locations):**
```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import type { HistoricalFundingItem } from '@/types/database.types'

interface FundingHistoryProps {
  historicalFunding: HistoricalFundingItem[]
}

export function FundingHistory({ historicalFunding }: FundingHistoryProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      return next
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Sort by year descending
  const sortedFunding = [...historicalFunding].sort((a, b) =>
    b.year.localeCompare(a.year)
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Funding History</h3>

      {sortedFunding.length === 0 ? (
        <p className="text-sm text-gray-500">No historical funding data</p>
      ) : (
        <div className="space-y-1">
          {sortedFunding.map(item => {
            const isExpanded = expandedYears.has(item.year)
            const hasLocations = item.locations && item.locations.length > 0

            return (
              <div key={item.year} className="border rounded-md">
                {/* Year Row - Always Shown */}
                <button
                  onClick={() => hasLocations && toggleYear(item.year)}
                  disabled={!hasLocations}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                    hasLocations ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {hasLocations ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )
                    ) : (
                      <div className="w-4" /> {/* Spacer */}
                    )}
                    <span className="font-medium">FY {item.year}</span>
                    {hasLocations && item.locations!.length > 1 && (
                      <span className="text-xs text-gray-500">
                        ({item.locations!.length} locations)
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.amount)}
                  </span>
                </button>

                {/* Locations - Shown When Expanded */}
                {isExpanded && hasLocations && (
                  <div className="border-t bg-gray-50 px-3 py-2 space-y-2">
                    {item.locations!.map((location, idx) => (
                      <div
                        key={location.frn || idx}
                        className="flex items-start gap-2 text-xs"
                      >
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {location.name}
                          </div>
                          <div className="text-gray-600">
                            {location.street && <div>{location.street}</div>}
                            <div>
                              {location.city}
                              {location.city && location.state && ', '}
                              {location.state} {location.zip}
                            </div>
                          </div>
                          {location.frn && (
                            <div className="text-gray-500">FRN: {location.frn}</div>
                          )}
                        </div>
                        <div className="font-medium text-green-600 flex-shrink-0">
                          {formatCurrency(location.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## VISUAL COMPARISON

### BEFORE (Current Display):
```
Funding History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025    $52,100
2024    $38,200
2023    $45,000
```

### AFTER (New Display - Collapsed):
```
Funding History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ FY 2025 (2 locations)    $52,100
▶ FY 2024 (1 location)     $38,200
▶ FY 2023 (1 location)     $45,000
```

### AFTER (New Display - Expanded 2025):
```
Funding History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ FY 2025 (2 locations)    $52,100
  📍 Regional Medical Center
     123 Main St
     Denver, CO 80202
     FRN: 5010001234        $25,000

  📍 Regional Medical - East Campus
     456 Oak Ave
     Aurora, CO 80012
     FRN: 5010001235        $27,100

▶ FY 2024 (1 location)     $38,200
▶ FY 2023 (1 location)     $45,000
```

---

## IMPLEMENTATION STEPS

**Step 1:** Update n8n "GET Historical Funding Data" node
- Navigate to: https://hyamie.app.n8n.cloud
- Find node: "GET Historical Funding Data"
- Update $select parameter
- Update $limit parameter
- Update $order parameter
- Test with HCP 27206

**Step 2:** Update n8n data processing code
- Find node that processes historical funding response
- Replace funding aggregation logic
- Test output format

**Step 3:** Update TypeScript types
- Edit: `dashboard/src/types/database.types.ts`
- Add FundingLocation interface
- Update HistoricalFundingItem interface

**Step 4:** Update FundingHistory component
- Edit: `dashboard/src/components/clinics/FundingHistory.tsx`
- Replace entire component with new expandable version
- Add lucide-react imports for icons

**Step 5:** Test end-to-end
- Run workflow for HCP with multiple locations
- Verify database storage format
- Verify UI displays correctly
- Test expand/collapse functionality

---

## BACKWARD COMPATIBILITY

The new structure is backward compatible:
- `locations` field is optional
- Existing records without locations will still display total amount
- Expand/collapse only shows when locations exist

---

## QUESTIONS FOR USER

1. **Node Name Verification**: What is the exact name of the node that processes the historical funding API response? (e.g., "Calculate Priority & Merge Data" or "Format Historical Funding Data")

2. **Current Code Location**: Can you copy the current code from that node so I can show exact before/after?

3. **Testing**: Do you want to test with HCP 27206 first before applying to all records?

4. **Limit**: Is 50 records per HCP sufficient, or should we increase/remove the limit?

---

## FIELD REFERENCE

All available fields from Commitments & Disbursements API (sm8n-gg82/2kme-evqq):

**Filing HCP (Applicant) Fields:**
- `filing_hcp` - HCP number
- `filing_hcp_name` - Name
- `filing_hcp_street` - Street address
- `filing_hcp_city` - City
- `filing_hcp_state` - State
- `filing_hcp_zip_code` - ZIP code

**Participating HCP (Service Delivery Site) Fields:**
- `participating_hcp` - HCP number (can be different from filing HCP)
- `participating_hcp_name` - Service delivery site name
- `participating_hcp_street` - Service delivery site street
- `participating_hcp_city` - Service delivery site city
- `participating_hcp_state` - Service delivery site state
- `participating_hcp_zip_code` - Service delivery site ZIP

**Funding Fields:**
- `funding_year` - Fiscal year (2023, 2024, 2025)
- `funding_request_number` - Unique FRN identifier
- `original_requested_amount` - Gross demand amount
- `original_committed_amount` - Original committed amount
- `total_commited_amount` - Total committed amount
- `total_authorized_disbursement_amount` - Disbursed amount

**Other Available Fields:**
- `program` - HCF or Telecom
- `fund_type` - Program type
- `service_type` - Type of service
- `bandwidth` - Bandwidth amount
- `category_of_expense` - Expense category
- `service_provider_name` - Provider name
- `funding_start_date` - Start date
- `funding_end_date` - End date
- `funding_commitment_date` - Commitment date

---

**Next Steps:** Please review this document and let me know:
1. If the changes look correct
2. Which node name processes the historical funding data
3. If you want to see the current code from that node before I show the exact replacement
