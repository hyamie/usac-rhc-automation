// ============================================================================
// n8n Code Node: Parse Service Category
// ============================================================================
// Location: Insert in "Process & Extract All Fields" node
// Purpose: Parse free-text service_type into standardized category
// ============================================================================

// Process USAC API response and extract all fields
const filings = $input.all();
const processedFilings = [];

for (const filing of filings) {
  const data = filing.json;

  // Extract contact information
  const contactEmail = data.contact_email_address || '';
  const mailContactEmail = data.mail_contact_email || '';
  const contactDomain = contactEmail.split('@')[1] || '';
  const mailDomain = mailContactEmail.split('@')[1] || '';

  // Consultant detection logic
  const isConsultant = contactDomain !== mailDomain && mailDomain !== '';

  // ========================================
  // NEW: Parse Service Category
  // ========================================
  const serviceTypeRaw = data.service_type || data.type_of_service || data.request_for_services || '';
  const serviceTypeLower = serviceTypeRaw.toLowerCase().trim();

  let serviceCategory = 'unknown';

  // Check for Voice services
  if (serviceTypeLower.includes('voice') ||
      serviceTypeLower.includes('telephone') ||
      serviceTypeLower.includes('voip') ||
      serviceTypeLower.includes('phone')) {
    serviceCategory = 'voice';
  }
  // Check for Data/Internet services
  else if (serviceTypeLower.includes('data') ||
           serviceTypeLower.includes('internet') ||
           serviceTypeLower.includes('broadband')) {
    serviceCategory = 'data';
  }
  // Check for Both/Combined services
  else if (serviceTypeLower.includes('both') ||
           (serviceTypeLower.includes('telecom') && serviceTypeLower.includes('internet'))) {
    serviceCategory = 'both_telecom_internet';
  }
  // Check for Telecommunications Only
  else if (serviceTypeLower.includes('telecommunications') &&
           serviceTypeLower.includes('only')) {
    serviceCategory = 'telecommunications_only';
  }
  // Check for Other specialized services
  else if (serviceTypeLower.includes('other') ||
           serviceTypeLower.includes('consulting') ||
           serviceTypeLower.includes('network design')) {
    serviceCategory = 'other';
  }

  // Generate deduplication hash
  const crypto = require('crypto');
  const hashString = `${data.hcp_number}-${data.posting_date}-${data.site_name}-${data.site_address}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  // Build processed filing object with all Phase 2 fields + NEW ABC routing fields
  const processed = {
    // Core identifiers
    hcp_number: data.hcp_number || data.health_care_provider_number,
    application_number: data.application_number || data.form_465_application_number,
    form_465_hash: hash,

    // Clinic information
    clinic_name: data.site_name || data.health_care_provider_name,
    address: data.site_address || data.service_delivery_site_physical_address,
    city: data.site_city || data.service_delivery_site_city,
    state: data.site_state || data.service_delivery_site_state,
    zip: data.site_zip || data.service_delivery_site_zip_code,

    // Contact information
    contact_name: data.contact_person_name || data.contact_name,
    contact_title: data.contact_person_title || data.contact_title,
    contact_email: contactEmail,
    contact_phone: data.contact_phone_number || data.contact_telephone_number,

    // Mail contact (potentially consultant)
    mail_contact_name: data.mail_contact_name || data.mailing_contact_name,
    mail_contact_email: mailContactEmail,
    mail_contact_company: data.mail_contact_company || data.mailing_contact_company,

    // Consultant detection
    is_consultant: isConsultant,
    consultant_company: isConsultant ? (data.mail_contact_company || data.mailing_contact_company) : null,
    consultant_email_domain: isConsultant ? mailDomain : null,
    consultant_detection_method: isConsultant ? 'auto_domain' : null,

    // Dates
    posting_date: data.posting_date,
    filing_date: data.form_465_date_certified || data.posting_date,
    allowable_contract_start_date: data.allowable_contract_date,

    // Program information
    program_type: 'Telecom',
    service_type: serviceTypeRaw, // Keep original for reference

    // ========================================
    // NEW: ABC Routing Fields
    // ========================================
    requested_service_category: serviceCategory,
    description_of_services: data.narrative_description || data.description,

    // Contract details
    contract_length: data.contract_term_months || null,
    bandwidth: data.bandwidth_mbps || null,

    // PDF URL
    form_465_pdf_url: data.application_number ? `https://rhc.usac.org/rhc/public/viewPdf.seam?documentId=${data.application_number}` : null,

    // Status
    processed: false,
    created_at: new Date().toISOString()
  };

  processedFilings.push({ json: processed });
}

return processedFilings;
