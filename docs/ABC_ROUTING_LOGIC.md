# ABC Email Routing Logic

## Overview

This document defines the multi-dimensional email routing logic for USAC RHC outreach automation. Instead of simple binary routing (consultant vs direct), we now use a **3-tier ABC routing system** based on:

1. **Contact Type** (Direct vs Consultant)
2. **Requested Service Category** (Voice, Data, Both, etc.)
3. **Funding Threshold** (High, Medium, Low based on 3-year history)

---

## Service Categories

We parse the free-text `service_type` field into standardized categories:

| Category | Description | Examples from Form 465 |
|----------|-------------|------------------------|
| `voice` | Voice/telephony services only | "Voice", "Telephone", "VoIP" |
| `data` | Data/internet services only | "Data", "Internet", "Broadband" |
| `both_telecom_internet` | Combined telecom + internet | "Both Telecommunications & Internet Services" |
| `telecommunications_only` | Telecom-specific (no internet) | "Telecommunications Service ONLY" |
| `other` | Other specialized services | "Consulting", "Network Design" |
| `unknown` | Cannot determine from text | Missing or ambiguous data |

---

## Funding Thresholds

Based on **total 3-year historical funding** (`funding_amount_1 + funding_amount_2 + funding_amount_3`):

| Threshold | Range | Strategic Value |
|-----------|-------|-----------------|
| `high` | > $100,000 | Large, established programs - highest priority |
| `medium` | $25,000 - $100,000 | Moderate programs - standard outreach |
| `low` | $1 - $24,999 | Small programs - light-touch outreach |
| `unknown` | No funding history | New participants - exploratory outreach |

---

## ABC Route Assignment Matrix

### **Route A: Premium Outreach** 🔥
**Target**: High-value, direct contacts with voice/comprehensive services

**Criteria** (ALL must match):
- Contact Type: **Direct Contact** (`is_consultant = false`)
- Service Category: **voice** OR **both_telecom_internet**
- Funding Threshold: **high** (> $100k)

**Email Strategy**:
- Personalized, consultative approach
- Emphasis on premium features and white-glove service
- Direct phone number for account rep
- Custom solution proposals

**Example**:
```
Clinic: Large rural hospital system
Contact: IT Director (direct)
Service: Voice + Internet
3-Year Funding: $250,000
→ Route A: Premium email with custom solution offering
```

---

### **Route B: Standard Outreach** 📊
**Target**: Medium-value contacts OR consultant-managed high-value accounts

**Criteria** (ANY must match):
- Direct Contact + Medium Funding ($25k-$100k)
- Direct Contact + High-Value Service (voice/both) + Low/Unknown Funding
- Consultant Contact + High Funding + High-Value Service
- Any Contact + Data Service + Medium/High Funding

**Email Strategy**:
- Professional, feature-focused approach
- Highlight cost savings and compliance benefits
- Standard contact methods (email, office line)
- Case studies and testimonials

**Example**:
```
Clinic: Mid-size community health center
Contact: Office Manager (direct)
Service: Data/Internet
3-Year Funding: $50,000
→ Route B: Standard email with ROI focus
```

---

### **Route C: Light-Touch Outreach** 📝
**Target**: Low-value, consultant-managed, or exploratory contacts

**Criteria** (ANY must match):
- Consultant Contact + Low Funding
- Consultant Contact + Other/Unknown Services
- Any Contact + Low Funding + Other/Unknown Services
- Any Contact + Unknown Funding + Unknown Service

**Email Strategy**:
- Brief, informational approach
- Focus on USAC program benefits and getting started
- Self-service resources and webinar links
- General inquiry form

**Example**:
```
Clinic: Small rural clinic (first-time applicant)
Contact: Telecom consultant
Service: Unknown (form incomplete)
3-Year Funding: $0 (no history)
→ Route C: Light-touch email with program overview
```

---

## Decision Tree Logic

```
START
  │
  ├─ Is Consultant? ────────────────────────┐
  │  │                                       │
  │  NO                                      YES
  │  │                                       │
  │  ├─ Funding = High? ───────────┐        ├─ Funding = High? ──────────┐
  │  │  │                           │        │  │                          │
  │  │  YES                         NO       │  YES                        NO
  │  │  │                           │        │  │                          │
  │  │  ├─ Service = Voice/Both?    │        │  ├─ Service = Voice/Both?  │
  │  │  │  │                        │        │  │  │                       │
  │  │  │  YES ────► ROUTE A        │        │  │  YES ────► ROUTE B      │
  │  │  │  NO ─────► ROUTE B        │        │  │  NO ─────► ROUTE C      │
  │  │                               │        │                            │
  │  │  ├─ Funding = Medium? ───────┤        └─ Funding = Medium/Low? ────┤
  │  │     │                         │           │                         │
  │  │     YES ────► ROUTE B         │           YES ────► ROUTE C         │
  │  │     NO ─────► ROUTE C         │           NO ─────► ROUTE C         │
  │                                  │                                     │
  └─────────────────────────────────┴─────────────────────────────────────┘
```

---

## Implementation in n8n Workflow

### Step 1: Parse Service Category
```javascript
// In "Process & Extract All Fields" node
const serviceType = (data.service_type || data.type_of_service || '').toLowerCase();

let serviceCategory = 'unknown';
if (serviceType.includes('voice') || serviceType.includes('telephone')) {
  serviceCategory = 'voice';
} else if (serviceType.includes('data') || serviceType.includes('internet') || serviceType.includes('broadband')) {
  serviceCategory = 'data';
} else if (serviceType.includes('both') || (serviceType.includes('telecom') && serviceType.includes('internet'))) {
  serviceCategory = 'both_telecom_internet';
} else if (serviceType.includes('telecommunications') && serviceType.includes('only')) {
  serviceCategory = 'telecommunications_only';
} else if (serviceType.includes('other')) {
  serviceCategory = 'other';
}

processed.requested_service_category = serviceCategory;
```

### Step 2: Calculate Funding Threshold
```javascript
// In "Calculate Priority & Merge Data" node (after historical funding merge)
const totalFunding = (filing.funding_amount_1 || 0) +
                     (filing.funding_amount_2 || 0) +
                     (filing.funding_amount_3 || 0);

filing.total_3yr_funding = totalFunding;

let fundingThreshold = 'unknown';
if (totalFunding > 100000) {
  fundingThreshold = 'high';
} else if (totalFunding >= 25000) {
  fundingThreshold = 'medium';
} else if (totalFunding > 0) {
  fundingThreshold = 'low';
}

filing.funding_threshold = fundingThreshold;
```

### Step 3: Assign ABC Route
```javascript
// New node: "Assign ABC Route"
const isConsultant = $json.is_consultant || false;
const serviceCategory = $json.requested_service_category || 'unknown';
const fundingThreshold = $json.funding_threshold || 'unknown';

let route = 'unassigned';
let reasoning = '';

// ROUTE A: Direct + High Funding + Premium Service
if (!isConsultant && fundingThreshold === 'high' &&
    (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) {
  route = 'route_a';
  reasoning = 'Direct contact, high funding (>$100k), premium service (voice/both) - Premium outreach';
}
// ROUTE B: Standard cases
else if (
  (!isConsultant && fundingThreshold === 'medium') ||
  (!isConsultant && (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) ||
  (isConsultant && fundingThreshold === 'high' && (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) ||
  (serviceCategory === 'data' && (fundingThreshold === 'medium' || fundingThreshold === 'high'))
) {
  route = 'route_b';
  reasoning = 'Medium funding OR high-value service OR consultant with high funding - Standard outreach';
}
// ROUTE C: Light-touch cases
else {
  route = 'route_c';
  reasoning = 'Low funding OR consultant with standard service OR unknown parameters - Light-touch outreach';
}

return {
  json: {
    ...$json,
    abc_route_assignment: route,
    route_reasoning: reasoning
  }
};
```

---

## Email Template Differences

### Route A Template (Premium)
```
Subject: Exclusive USAC RHC Partnership Opportunity - [Clinic Name]

Dear [Contact Name],

I'm reaching out directly because [Clinic Name] represents exactly the kind of
forward-thinking healthcare organization we specialize in serving...

[Personalized analysis of their $X funding history]
[Custom solution proposal]
[Direct account rep phone number]

Best regards,
[Your Name]
Senior USAC RHC Solutions Architect
Direct: (XXX) XXX-XXXX
```

### Route B Template (Standard)
```
Subject: USAC RHC Services - Cost Savings & Compliance for [Clinic Name]

Hi [Contact Name],

We help rural health care providers like [Clinic Name] maximize their USAC
funding while ensuring full program compliance...

[Standard service overview]
[ROI calculator and case studies]
[General contact info]

Sincerely,
[Your Name]
USAC RHC Account Manager
```

### Route C Template (Light-Touch)
```
Subject: Getting Started with USAC RHC Program - [Clinic Name]

Hello [Contact Name],

I noticed [Clinic Name] recently filed Form 465. We're here to help you
navigate the USAC Rural Health Care program...

[Brief program overview]
[Link to resources and webinar]
[General inquiry form]

Regards,
USAC RHC Support Team
```

---

## Dashboard Integration

### New Filter: ABC Route
Add dropdown filter in ClinicList.tsx:
```typescript
const [routeFilter, setRouteFilter] = useState<'all' | 'route_a' | 'route_b' | 'route_c'>('all')
```

### New Badge Display
In ClinicCard.tsx, show route assignment:
```tsx
{clinic.abc_route_assignment && (
  <Badge variant={
    clinic.abc_route_assignment === 'route_a' ? 'premium' :
    clinic.abc_route_assignment === 'route_b' ? 'default' :
    'secondary'
  }>
    {clinic.abc_route_assignment === 'route_a' && '🔥 Premium'}
    {clinic.abc_route_assignment === 'route_b' && '📊 Standard'}
    {clinic.abc_route_assignment === 'route_c' && '📝 Light-Touch'}
  </Badge>
)}
```

---

## Testing Strategy

### Test Cases

| Test ID | Contact | Service | Funding | Expected Route |
|---------|---------|---------|---------|----------------|
| TC-001 | Direct | Voice | $150k | Route A |
| TC-002 | Direct | Both | $200k | Route A |
| TC-003 | Direct | Data | $80k | Route B |
| TC-004 | Consultant | Voice | $150k | Route B |
| TC-005 | Direct | Voice | $10k | Route B |
| TC-006 | Consultant | Other | $50k | Route C |
| TC-007 | Direct | Unknown | $0 | Route C |
| TC-008 | Consultant | Data | $5k | Route C |

---

## Future Enhancements

1. **Machine Learning**: Use historical response rates to auto-adjust routing rules
2. **Geographic Targeting**: Add state/region-based routing
3. **Time-Based Routing**: Adjust strategy based on filing deadline proximity
4. **A/B Testing**: Track open/response rates per route to optimize
5. **Dynamic Thresholds**: Adjust funding thresholds based on annual program budgets

---

## Metrics to Track

- **Route Distribution**: % of filings assigned to each route
- **Open Rates**: Open rate by route (target: A > B > C)
- **Response Rates**: Response rate by route
- **Conversion Rates**: Contract wins by route
- **ROI per Route**: Revenue generated per route dollar spent

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Owner**: USAC RHC Automation Team
