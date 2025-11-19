import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required' },
        { status: 400 }
      )
    }

    // Call USAC API to fetch records for the date range
    const queryParams = new URLSearchParams({
      program: 'Telecom',
      $where: endDate
        ? `posting_start_date>='${startDate}' AND posting_start_date<='${endDate}'`
        : `posting_start_date='${startDate}'`,
      $limit: '1000',
      $order: 'posting_start_date DESC'
    })

    const usacResponse = await fetch(
      `https://opendata.usac.org/resource/96rf-xd57.json?${queryParams}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!usacResponse.ok) {
      throw new Error(`USAC API error: ${usacResponse.statusText}`)
    }

    const records = await usacResponse.json()

    // Process each record and insert into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const processedRecords = []
    const skippedRecords = []
    const errors = []

    for (const data of records) {
      try {
        // Extract contact information
        const contactEmail = data.contact_email || ''
        const mailContactEmail = data.mail_contact_email || ''
        const contactDomain = contactEmail.split('@')[1] || ''
        const mailDomain = mailContactEmail.split('@')[1] || ''

        // Consultant detection
        const isConsultant = contactDomain !== mailDomain && mailDomain !== ''

        // Generate deduplication hash
        const crypto = await import('crypto')
        const hashString = `${data.hcp_number}-${data.posting_start_date}-${data.hcp_name}-${data.site_address_line_1}`
        const hash = crypto.createHash('sha256').update(hashString).digest('hex')

        // Build clinic record
        const clinic = {
          hcp_number: data.hcp_number,
          application_number: data.application_number,
          form_465_hash: hash,
          clinic_name: data.hcp_name,
          address: data.site_address_line_1,
          city: data.site_city,
          state: data.site_state,
          zip: data.site_zip_code,
          contact_name: data.contact_first_name && data.contact_last_name
            ? `${data.contact_first_name} ${data.contact_last_name}`
            : null,
          contact_email: contactEmail || null,
          contact_phone: data.contact_phone || null,
          mail_contact_name: data.mail_contact_first_name && data.mail_contact_last_name
            ? `${data.mail_contact_first_name} ${data.mail_contact_last_name}`
            : null,
          mail_contact_email: mailContactEmail || null,
          mail_contact_company: data.mail_contact_organization_name || null,
          is_consultant: isConsultant,
          consultant_company: isConsultant ? data.mail_contact_organization_name : null,
          consultant_email_domain: isConsultant ? mailDomain : null,
          consultant_detection_method: isConsultant ? 'auto_domain' : null,
          filing_date: data.posting_start_date,
          program_type: 'Telecom',
          service_type: data.request_for_services || null,
          description_of_services: data.description_of_services_requested || null,
          form_465_pdf_url: data.link_to_fcc_form_pdf || null,
          processed: false,
          priority_score: 50,
          priority_label: 'Medium'
        }

        // Insert into Supabase (will skip if hash already exists due to unique constraint)
        const supabaseResponse = await fetch(
          `${supabaseUrl}/rest/v1/clinics_pending_review`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(clinic)
          }
        )

        if (supabaseResponse.ok) {
          const inserted = await supabaseResponse.json()
          processedRecords.push(inserted[0])
        } else if (supabaseResponse.status === 409) {
          // Duplicate - this is expected and fine
          skippedRecords.push({ hcp_number: data.hcp_number, reason: 'duplicate' })
        } else {
          const errorText = await supabaseResponse.text()
          errors.push({
            hcp_number: data.hcp_number,
            error: errorText
          })
        }
      } catch (err) {
        errors.push({
          hcp_number: data.hcp_number,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_fetched: records.length,
        inserted: processedRecords.length,
        skipped: skippedRecords.length,
        errors: errors.length
      },
      details: {
        inserted: processedRecords,
        skipped: skippedRecords,
        errors
      }
    })

  } catch (error) {
    console.error('Workflow trigger error:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
