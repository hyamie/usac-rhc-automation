import json

# Read the workflow
with open('workflows/current_workflow_live.json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# The new JavaScript code with proper formatting
new_code = """// Function to collect document links from 20 separate USAC columns
function collectDocumentLinks(data) {
  const rfpLinks = [];
  const additionalDocs = [];

  // Collect RFP links (RFP 1-10)
  for (let i = 1; i <= 10; i++) {
    const rfpLink = data[`rfp_${i}`] || data[`RFP_${i}`] || data[`rfp${i}`];
    if (rfpLink && rfpLink.trim() !== '') {
      rfpLinks.push(rfpLink.trim());
    }
  }

  // Collect Additional Document links (1-10)
  for (let i = 1; i <= 10; i++) {
    const docLink = data[`additional_document_${i}`] || data[`Additional_Document_${i}`] || data[`additional_doc_${i}`];
    if (docLink && docLink.trim() !== '') {
      additionalDocs.push(docLink.trim());
    }
  }

  return {
    rfp_links: rfpLinks,
    additional_docs: additionalDocs
  };
}

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

  // Generate deduplication hash
  const crypto = require('crypto');
  const hashString = `${data.hcp_number}-${data.posting_date}-${data.site_name}-${data.site_address}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  // Build processed filing object with all Phase 2 fields
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
    zip: data.site_zip || data.site_zip_code,

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
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,

    // Contract details
    contract_length: data.contract_term_months || null,
    bandwidth: data.bandwidth_mbps || null,

    // Document links (JSONB) - NEW FIELD
    additional_documents: collectDocumentLinks(data),

    // PDF URL
    form_465_pdf_url: data.application_number ? `https://rhc.usac.org/rhc/public/viewPdf.seam?documentId=${data.application_number}` : null,

    // Status
    processed: false,
    created_at: new Date().toISOString()
  };

  processedFilings.push({ json: processed });
}

return processedFilings;"""

# Find and update the node
for node in workflow['nodes']:
    if node['id'] == '330397b1-c043-48a8-b031-558be4556a5e':
        node['parameters']['jsCode'] = new_code
        print(f"[OK] Updated node: {node['name']}")
        break

# Remove pinData and other metadata that shouldn't be sent in update
if 'pinData' in workflow:
    del workflow['pinData']
if 'versionId' in workflow:
    del workflow['versionId']
if 'triggerCount' in workflow:
    del workflow['triggerCount']
if 'shared' in workflow:
    del workflow['shared']
if 'tags' in workflow:
    del workflow['tags']

# Save the updated workflow
with open('workflows/workflow_final_update.json', 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2)

print('[OK] Updated workflow saved to workflow_final_update.json')
print('[OK] Ready to push to n8n API')
