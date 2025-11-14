# Route C: Light-Touch Email Template

## Template ID: `route_c_light_touch`
## Target: Low Funding OR Unknown Services OR First-Time Participants

---

## Claude Prompt for n8n (Anthropic Chat Model Node)

```
You are a USAC RHC support specialist writing a brief, informational outreach email.

Context:
- Clinic: {{$json.clinic_name}}
- Location: {{$json.city}}, {{$json.state}}
- Contact: {{$json.contact_name || 'Healthcare Team'}}
- Contact Type: {{$json.is_consultant ? 'Via Consultant (' + $json.consultant_company + ')' : 'Direct Contact'}}
- Service Requested: {{$json.requested_service_category || 'Not specified'}}
- 3-Year Funding History: ${{$json.total_3yr_funding || 0}} {{#if $json.total_3yr_funding === 0}}(First-time participant){{/if}}
- Recent Filing: {{$json.filing_date}}
- Route Assignment: {{$json.abc_route_assignment}} ({{$json.route_reasoning}})

Email Requirements:
1. **Subject Line**: Simple, informational (max 60 chars)
   - Focus on getting started or program information
   - Example: "USAC RHC Program - Getting Started Guide"

2. **Opening**: Friendly, brief greeting
   - Acknowledge their Form 465 filing
   - {{#if $json.total_3yr_funding === 0}}Welcome them as new participant{{/if}}
   - Keep it concise (1-2 sentences)

3. **Body**:
   - Brief overview of how you can help
   - Focus on educational resources and self-service options
   - Mention upcoming webinars or information sessions
   - Include link to USAC resource center/FAQ
   - Keep it high-level and non-pushy

4. **Call to Action**:
   - Provide general inquiry email or form
   - Invite to browse resources at their convenience
   - Optional: Link to upcoming webinar or info session
   - Keep it low-pressure

5. **Tone**: Friendly, helpful, informational
   - Educational rather than sales-focused
   - Welcoming and supportive
   - Brief and to-the-point

6. **Length**: 100-125 words (shorter than other routes)

Format:
Subject: [Your subject line here]

Body: [Your email content here]

Signature:
USAC RHC Support Team
Charger Access
Info: info@chargeraccess.com
Resources: www.chargeraccess.com/usac-resources
```

---

## Example Output (New Participant)

```
Subject: Welcome to USAC RHC Program - Resources for Meadow Creek Clinic

Hello,

We noticed that Meadow Creek Health Center recently filed Form 465 for USAC RHC services. Welcome to the program!

Navigating the USAC Rural Health Care program can seem complex at first, but we're here to help. We've created a comprehensive resource center specifically for rural healthcare providers getting started with the program.

Available resources:
• Getting Started Guide for new USAC participants
• Form 465 filing checklist and compliance tips
• Monthly webinar: "Maximizing Your RHC Funding"
• FAQ covering common questions about eligible services

Visit our USAC Resource Center anytime: www.chargeraccess.com/usac-resources

If you have questions or would like to discuss your telecommunications needs, feel free to reach out. We're happy to help you understand your options under the USAC program.

Best regards,

USAC RHC Support Team
Charger Access
Info: info@chargeraccess.com
Resources: www.chargeraccess.com/usac-resources

Next Steps: Download our free "USAC RHC Quick Start Guide" to get the most out of your funding.
```

---

## Example Output (Low Funding / Consultant-Managed)

```
Subject: USAC RHC Services - Information for Valley View Clinic

Hi there,

I noticed Valley View Clinic recently filed Form 465 through Alpine Telecom Consultants. We work with many consulting firms and rural health providers in the USAC RHC program and wanted to share some helpful resources.

Whether you're exploring service options or finalizing your telecommunications plan, our USAC Resource Center has tools to help:
• Cost comparison calculators for different service types
• Compliance checklists and documentation templates
• Case studies from rural health clinics across the U.S.

Visit anytime: www.chargeraccess.com/usac-resources

We also host monthly webinars covering USAC program updates, best practices, and Q&A sessions. Our next session is "Telehealth Connectivity Solutions" on November 20th.

If you'd like to learn more about our services or discuss your specific needs, you can reach us at info@chargeraccess.com or fill out our brief inquiry form online.

Thanks for considering Charger Access for your USAC RHC needs.

Best regards,

USAC RHC Support Team
Charger Access
Info: info@chargeraccess.com
Resources: www.chargeraccess.com/usac-resources
```

---

## Customization Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{$json.clinic_name}}` | Clinic name | "Meadow Creek Health Center" |
| `{{$json.contact_name}}` | Contact person (optional) | "Sarah" or null |
| `{{$json.city}}, {{$json.state}}` | Location | "Butte, MT" |
| `{{$json.total_3yr_funding}}` | Funding amount | 0 or 8500 |
| `{{$json.requested_service_category}}` | Service type | "unknown" or "other" |
| `{{$json.is_consultant}}` | Consultant flag | true/false |
| `{{$json.consultant_company}}` | Consultant company | "Alpine Telecom Consultants" |

---

## Success Metrics

- **Target Open Rate**: 30-40%
- **Target Response Rate**: 3-5%
- **Average Time to Response**: 7-14 days
- **Conversion to Inquiry**: 10-15% of responders
- **Resource Center Visits**: 20-30% click-through

---

## Conditional Logic

**If First-Time Participant** (`total_3yr_funding === 0`):
- Use "Welcome to USAC RHC Program" subject line
- Add welcome language in opening
- Focus heavily on getting started resources
- Include link to beginner's guide

**If Consultant Contact** (`is_consultant === true`):
- Acknowledge the consulting firm by name
- Use B2B language: "We work with many consulting firms..."
- Emphasize self-service resources that consultants can share

**If Unknown Services** (`requested_service_category === 'unknown'`):
- Remove service-specific language
- Keep resources general and comprehensive
- Focus on educational content vs specific offerings

---

## Testing Checklist

- [ ] Generic/informational tone maintained
- [ ] No aggressive sales language
- [ ] Resource center links working
- [ ] Webinar registration link current
- [ ] Email signature properly formatted
- [ ] Subject line < 60 characters
- [ ] Body 100-125 words (brief!)
- [ ] Conditional logic for new participants working
- [ ] Consultant acknowledgment conditional rendering
- [ ] Call-to-action is low-pressure
- [ ] Free resource downloads available
- [ ] Contact email monitored
