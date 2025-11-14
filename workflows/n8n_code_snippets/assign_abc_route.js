// ============================================================================
// n8n Code Node: Assign ABC Route
// ============================================================================
// Location: NEW node - insert AFTER "Calculate Priority & Merge Data"
// Purpose: Assign email template route based on multi-dimensional criteria
// ============================================================================

// Extract routing factors
const isConsultant = $json.is_consultant || false;
const serviceCategory = $json.requested_service_category || 'unknown';
const fundingThreshold = $json.funding_threshold || 'unknown';
const totalFunding = $json.total_3yr_funding || 0;

let route = 'unassigned';
let reasoning = '';

// ============================================================================
// ROUTE A: Premium Outreach
// ============================================================================
// Target: Direct + High Funding (>$100k) + Premium Service (voice/both)
if (!isConsultant &&
    fundingThreshold === 'high' &&
    (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) {
  route = 'route_a';
  reasoning = `Premium Route: Direct contact with high funding ($${(totalFunding).toLocaleString()}) requesting ${serviceCategory} services - White-glove treatment`;
}

// ============================================================================
// ROUTE B: Standard Outreach
// ============================================================================
// Multiple criteria - broader targeting
else if (
  // Direct contact with medium funding (any service)
  (!isConsultant && fundingThreshold === 'medium') ||

  // Direct contact with premium service (any funding level except none)
  (!isConsultant &&
   (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet') &&
   fundingThreshold !== 'unknown') ||

  // Consultant with high funding + premium service
  (isConsultant &&
   fundingThreshold === 'high' &&
   (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) ||

  // Data services with medium or high funding (any contact type)
  (serviceCategory === 'data' &&
   (fundingThreshold === 'medium' || fundingThreshold === 'high'))
) {
  route = 'route_b';

  // Provide specific reasoning based on which criteria matched
  if (!isConsultant && fundingThreshold === 'medium') {
    reasoning = `Standard Route: Direct contact with medium funding ($${(totalFunding).toLocaleString()}) - Professional outreach`;
  } else if (!isConsultant && (serviceCategory === 'voice' || serviceCategory === 'both_telecom_internet')) {
    reasoning = `Standard Route: Direct contact requesting ${serviceCategory} services - Feature-focused outreach`;
  } else if (isConsultant && fundingThreshold === 'high') {
    reasoning = `Standard Route: Consultant-managed account with high funding ($${(totalFunding).toLocaleString()}) - Professional B2B outreach`;
  } else {
    reasoning = `Standard Route: ${serviceCategory} services with ${fundingThreshold} funding - Standard approach`;
  }
}

// ============================================================================
// ROUTE C: Light-Touch Outreach
// ============================================================================
// Default for all remaining cases
else {
  route = 'route_c';

  // Provide specific reasoning
  if (isConsultant && fundingThreshold === 'low') {
    reasoning = `Light-Touch Route: Consultant-managed with low funding ($${(totalFunding).toLocaleString()}) - Informational approach`;
  } else if (fundingThreshold === 'unknown' || totalFunding === 0) {
    reasoning = `Light-Touch Route: No funding history - Exploratory outreach for new participant`;
  } else if (serviceCategory === 'unknown' || serviceCategory === 'other') {
    reasoning = `Light-Touch Route: Service type unclear (${serviceCategory}) - General information approach`;
  } else {
    reasoning = `Light-Touch Route: ${serviceCategory} service, ${fundingThreshold} funding via ${isConsultant ? 'consultant' : 'direct'} - Brief informational outreach`;
  }
}

// Return with route assignment
return {
  json: {
    ...$json,
    abc_route_assignment: route,
    route_reasoning: reasoning,

    // For backward compatibility with existing email template logic
    email_template_type: route === 'route_a' ? 'premium' :
                         route === 'route_b' ? 'standard' :
                         'light_touch'
  }
};
