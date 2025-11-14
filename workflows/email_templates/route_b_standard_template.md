# Route B: Standard Email Template

## Template ID: `route_b_standard`
## Target: Medium Funding OR Consultant + High Value OR Standard Services

---

## Claude Prompt for n8n (Anthropic Chat Model Node)

```
You are a USAC RHC account manager writing a professional outreach email.

Context:
- Clinic: {{$json.clinic_name}}
- Location: {{$json.city}}, {{$json.state}}
- Contact: {{$json.contact_name}} ({{$json.contact_title || 'Healthcare Professional'}})
- Contact Type: {{$json.is_consultant ? 'Via Consultant (' + $json.consultant_company + ')' : 'Direct Contact'}}
- Service Requested: {{$json.requested_service_category}}
- 3-Year Funding History: ${{$json.total_3yr_funding || 0}}
- Recent Filing: {{$json.filing_date}}
- Route Assignment: {{$json.abc_route_assignment}} ({{$json.route_reasoning}})

Email Requirements:
1. **Subject Line**: Professional, benefit-focused (max 60 chars)
   - Focus on cost savings, compliance, or service quality
   - Example: "USAC RHC Services - Cost Savings for {{$json.clinic_name}}"

2. **Opening**: Professional greeting
   - Address by name if available, otherwise use professional title
   - Brief introduction of who you are and why you're reaching out
   - Mention their recent Form 465 filing

3. **Body**:
   - Highlight key benefits: cost savings, compliance, reliability
   - Mention USAC program expertise and track record
   - {{#if $json.total_3yr_funding > 0}}Acknowledge their USAC participation history{{/if}}
   - Include 2-3 specific service features relevant to their service type
   - Brief mention of success stories or testimonials

4. **Call to Action**:
   - Invite to connect via email or general office line
   - Offer information packet or webinar registration
   - Suggest reviewing their current services for optimization

5. **Tone**: Professional, helpful, feature-focused
   - Balance between personable and business-like
   - Emphasize value proposition and ROI
   - Not overly salesy

6. **Length**: 150-200 words

Format:
Subject: [Your subject line here]

Body: [Your email content here]

Signature:
[Your Name]
USAC RHC Account Manager
Charger Access
Office: (555) 123-4500
[email@chargeraccess.com]
www.chargeraccess.com
```

---

## Example Output

```
Subject: USAC RHC Services - Cost Savings & Compliance for Pine Ridge Clinic

Hi Jessica,

I'm reaching out because I noticed Pine Ridge Community Clinic recently filed Form 465 for data and internet services. We specialize in helping rural health care providers like yours maximize USAC funding while ensuring full program compliance.

Our USAC RHC services include:
• Competitive pricing with guaranteed 30-40% savings over commercial rates
• Full FCC compliance support and automated documentation
• 24/7 technical support with rural healthcare expertise
• Simplified invoicing aligned with USAC payment schedules

With your recent $65,000 funding request, we estimate you could save approximately $18,000-$24,000 annually through our optimized solutions. Many of our clients also appreciate our proactive approach to USAC rule changes and filing deadlines.

Recent clients in Montana have reported significant improvements in both cost savings and service reliability. I'd be happy to share case studies specific to rural health clinics of your size.

Would you be interested in a brief conversation about how we can help optimize your telecommunications expenses? I can also send you our USAC RHC information packet and ROI calculator.

Feel free to reply to this email or call our office at your convenience.

Best regards,

Jennifer Martinez
USAC RHC Account Manager
Charger Access
Office: (555) 123-4500
jmartinez@chargeraccess.com
www.chargeraccess.com

Ready to learn more? Visit our USAC Resource Center: www.chargeraccess.com/usac-resources
```

---

## Customization Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{$json.clinic_name}}` | Clinic name | "Pine Ridge Community Clinic" |
| `{{$json.contact_name}}` | Contact person | "Jessica Williams" |
| `{{$json.contact_title}}` | Title/role | "Operations Director" |
| `{{$json.city}}, {{$json.state}}` | Location | "Missoula, MT" |
| `{{$json.total_3yr_funding}}` | Funding amount | 65000 |
| `{{$json.requested_service_category}}` | Service type | "data" |
| `{{$json.is_consultant}}` | Consultant flag | true/false |
| `{{$json.consultant_company}}` | Consultant company | "TechConsult LLC" |

---

## Success Metrics

- **Target Open Rate**: 45-55%
- **Target Response Rate**: 8-12%
- **Average Time to Response**: 3-5 business days
- **Conversion to Call**: 25-35% of responders

---

## Conditional Logic

**If Consultant Contact** (`is_consultant === true`):
- Adjust opening: "I'm reaching out to {{consultant_company}} regarding..."
- B2B tone: More formal, emphasize multi-client support
- Offer: "We work with several consulting firms managing USAC clients..."

**If No Funding History** (`total_3yr_funding === 0`):
- Remove savings estimate paragraph
- Add: "As a first-time USAC participant, navigating the program can be complex..."
- Focus on getting started support

---

## Testing Checklist

- [ ] Personalization tokens correctly inserted
- [ ] Conditional logic for consultant vs direct applied
- [ ] Funding history conditional rendering working
- [ ] Office phone number correct
- [ ] Email signature properly formatted
- [ ] Subject line < 60 characters
- [ ] Body 150-200 words
- [ ] Professional but approachable tone
- [ ] ROI calculator link working
- [ ] Call-to-action clear
