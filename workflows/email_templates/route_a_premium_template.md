# Route A: Premium Email Template

## Template ID: `route_a_premium`
## Target: Direct + High Funding + Voice/Both Services

---

## Claude Prompt for n8n (Anthropic Chat Model Node)

```
You are a senior USAC RHC solutions architect writing a premium, personalized outreach email.

Context:
- Clinic: {{$json.clinic_name}}
- Location: {{$json.city}}, {{$json.state}}
- Contact: {{$json.contact_name}} ({{$json.contact_title || 'Healthcare Professional'}})
- Contact Type: {{$json.is_consultant ? 'Via Consultant' : 'Direct Contact'}}
- Service Requested: {{$json.requested_service_category}}
- 3-Year Funding History: ${{$json.total_3yr_funding}}
- Recent Filing: {{$json.filing_date}}
- Route Assignment: {{$json.abc_route_assignment}} ({{$json.route_reasoning}})

Email Requirements:
1. **Subject Line**: Personalized, executive-level appeal (max 60 chars)
   - Must reference their high-value program or specific need
   - Example: "Exclusive USAC Partnership - {{$json.clinic_name}}"

2. **Opening**: Direct, consultant-style approach
   - Address them by name
   - Demonstrate knowledge of their $X funding history
   - Position as exclusive partnership opportunity

3. **Body**:
   - Acknowledge their successful USAC participation (3-year history)
   - Highlight premium features relevant to voice/telecom services
   - Mention white-glove service and dedicated account management
   - Offer custom solution analysis
   - Include ROI/cost savings specific to their funding level

4. **Call to Action**:
   - Provide direct phone line for senior account rep
   - Offer complimentary consultation
   - Suggest specific next step (e.g., "15-minute strategy call")

5. **Tone**: Consultative, executive-level, personalized
   - NOT salesy
   - Focus on strategic partnership
   - Emphasize expertise and track record

6. **Length**: 200-300 words

Format:
Subject: [Your subject line here]

Body: [Your email content here]

Signature:
[Your Name]
Senior USAC RHC Solutions Architect
Charger Access
Direct: (555) 123-4567
[email@chargeraccess.com]
www.chargeraccess.com
```

---

## Example Output

```
Subject: Exclusive USAC Partnership - River Valley Medical Center

Dear Dr. Johnson,

I'm reaching out directly because River Valley Medical Center's impressive $175,000 in USAC funding over the past three years represents exactly the kind of forward-thinking healthcare organization we specialize in serving.

As a senior solutions architect focused exclusively on high-performing USAC RHC participants, I've been following your recent Form 465 filing for voice and telecommunications services. Given your program's scale and your track record of maximizing federal funding, I'd like to discuss how we can help you achieve even greater cost savings while ensuring full compliance.

Our white-glove service includes:
• Dedicated account management with direct access to senior technical staff
• Custom network design optimized for your multi-location telehealth needs
• Proactive USAC compliance monitoring and FCC filing support
• Guaranteed cost savings of 25-40% over standard commercial rates

Based on your funding history, we estimate potential annual savings of $40,000-$60,000 through our optimized solutions.

I'd welcome the opportunity for a brief 15-minute strategy call to discuss your specific telecommunications goals and share how we've helped similar rural health systems like yours maximize their RHC investments.

Would Thursday afternoon or Friday morning work for a brief conversation?

Best regards,

Michael Thompson
Senior USAC RHC Solutions Architect
Charger Access
Direct: (555) 123-4567
mthompson@chargeraccess.com
www.chargeraccess.com

P.S. - We're currently offering complimentary network assessments for established USAC participants. I'd be happy to arrange this for River Valley if you're interested.
```

---

## Customization Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{$json.clinic_name}}` | Clinic name | "River Valley Medical Center" |
| `{{$json.contact_name}}` | Contact person | "Dr. Sarah Johnson" |
| `{{$json.contact_title}}` | Title/role | "Chief Medical Officer" |
| `{{$json.city}}, {{$json.state}}` | Location | "Helena, MT" |
| `{{$json.total_3yr_funding}}` | Funding amount | 175000 |
| `{{$json.requested_service_category}}` | Service type | "voice" or "both_telecom_internet" |
| `{{$json.filing_date}}` | Recent filing date | "2025-11-06" |

---

## Success Metrics

- **Target Open Rate**: 60-70%
- **Target Response Rate**: 15-20%
- **Average Time to Response**: 2-3 business days
- **Conversion to Call**: 40-50% of responders

---

## Testing Checklist

- [ ] Personalization tokens correctly inserted
- [ ] Funding amount formatted with commas
- [ ] Direct phone number working
- [ ] Email signature properly formatted
- [ ] Subject line < 60 characters
- [ ] Body 200-300 words
- [ ] Professional tone maintained
- [ ] Custom ROI calculation included
- [ ] Call-to-action clear and specific
