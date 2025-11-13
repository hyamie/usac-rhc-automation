// Improved Template Rendering with Better Formatting
// Version: 2.0 - Enhanced enrichment integration and formatting

const clinicData = $('Get Clinic Details').item.json;
const clinic = Array.isArray(clinicData) ? clinicData[0] : clinicData;

const templateData = $('Get Template (Rotating)').item.json;
const template = Array.isArray(templateData) ? templateData[0] : templateData;

const perplexity = $input.item.json;

// Extract and clean enrichment context
let enrichmentContext = perplexity.choices[0].message.content;

// Clean up enrichment context - remove unnecessary prefixes/formatting
enrichmentContext = enrichmentContext
  .replace(/^(Here's what I found:|Based on my research:)/i, '')
  .trim();

// Format enrichment as a natural continuation
// If it's a bullet list, convert to a sentence
if (enrichmentContext.includes('\n-') || enrichmentContext.includes('\n•')) {
  // Extract first 2-3 relevant facts
  const facts = enrichmentContext
    .split('\n')
    .filter(line => line.trim().match(/^[-•*]/))
    .slice(0, 2)
    .map(line => line.replace(/^[-•*]\s*/, '').trim());

  if (facts.length > 0) {
    enrichmentContext = facts.join(', and ') + '.';
  }
} else {
  // If it's paragraph format, take first 1-2 sentences
  const sentences = enrichmentContext.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 2) {
    enrichmentContext = sentences.slice(0, 2).join(' ');
  }
}

// Ensure enrichment context ends with proper punctuation
if (!enrichmentContext.match(/[.!?]$/)) {
  enrichmentContext += '.';
}

// Format enrichment as natural continuation after Form 465 mention
// Example: "I noticed [clinic] filed Form 465. I also saw [enrichment]."
let formattedEnrichment = '';
if (enrichmentContext.length > 10) {
  // Check if enrichment has specific clinic news
  if (enrichmentContext.toLowerCase().includes(clinic.clinic_name.toLowerCase()) ||
      enrichmentContext.toLowerCase().includes(clinic.city.toLowerCase())) {
    formattedEnrichment = `I also saw that ${enrichmentContext.charAt(0).toLowerCase()}${enrichmentContext.slice(1)}`;
  } else {
    // Generic context - make it less prominent
    formattedEnrichment = enrichmentContext;
  }
}

// Extract first name from contact name fields
const firstName = clinic.mail_contact_first_name || clinic.contact_name?.split(' ')[0] || 'there';

// Mike's signature (plain text version)
const signature = `Mike Hyams
Charger Access, LLC
615-622-4603 Office
206 Gothic Ct, Suite 304
Franklin, TN 37067
www.chargeraccess.com`;

// Replace placeholders in subject
let renderedSubject = template.subject_template
  .replace(/\{\{clinic_name\}\}/g, clinic.clinic_name)
  .replace(/\{\{funding_year\}\}/g, clinic.funding_year || '2025')
  .replace(/\{\{city\}\}/g, clinic.city)
  .replace(/\{\{state\}\}/g, clinic.state);

// Replace placeholders in body
let renderedBody = template.body_template
  .replace(/\{\{first_name\}\}/g, firstName)
  .replace(/\{\{clinic_name\}\}/g, clinic.clinic_name)
  .replace(/\{\{funding_year\}\}/g, clinic.funding_year || '2025')
  .replace(/\{\{enrichment_context\}\}/g, formattedEnrichment)
  .replace(/\{\{city\}\}/g, clinic.city)
  .replace(/\{\{state\}\}/g, clinic.state)
  .replace(/\{\{signature\}\}/g, signature);

// Clean up body formatting:
// 1. Normalize line breaks (max 2 consecutive)
renderedBody = renderedBody.replace(/\n{3,}/g, '\n\n');

// 2. Remove any double spaces
renderedBody = renderedBody.replace(/  +/g, ' ');

// 3. Ensure single space after periods
renderedBody = renderedBody.replace(/\.\s+/g, '. ');

// 4. Trim leading/trailing whitespace
renderedBody = renderedBody.trim();

// Create HTML version for better formatting
const htmlBody = renderedBody
  .split('\n\n')
  .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
  .join('');

return {
  clinic_id: clinic.id,
  template_id: template.id,
  template_variant: template.template_variant,
  times_used: template.times_used,
  subject_rendered: renderedSubject,
  body_rendered: renderedBody,  // Plain text version
  body_html: htmlBody,           // HTML version for better formatting
  enrichment_data: {
    source: "perplexity",
    context: enrichmentContext,
    raw_context: perplexity.choices[0].message.content,
    cost: 0.005,
    formatted: formattedEnrichment
  },
  recipient_email: clinic.contact_email,
  recipient_name: clinic.contact_name || `${clinic.mail_contact_first_name} ${clinic.mail_contact_last_name}`.trim()
};
