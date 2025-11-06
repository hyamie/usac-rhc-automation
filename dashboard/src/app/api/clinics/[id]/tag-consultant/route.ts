import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the clinic to get email domain
    const { data: clinic, error: fetchError } = await supabase
      .from('clinics_pending_review')
      .select('mail_contact_email, mail_contact_company, consultant_email_domain')
      .eq('id', id)
      .single();

    if (fetchError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    // Extract email domain
    const emailDomain = clinic.mail_contact_email
      ? clinic.mail_contact_email.split('@')[1]
      : clinic.consultant_email_domain;

    if (!emailDomain) {
      return NextResponse.json(
        { error: 'No email domain found to tag' },
        { status: 400 }
      );
    }

    // Update the clinic record
    const { error: updateError } = await supabase
      .from('clinics_pending_review')
      .update({
        is_consultant: true,
        consultant_detection_method: 'manual_tagged',
        consultant_email_domain: emailDomain,
        consultant_company: clinic.mail_contact_company,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Add email domain to consultant_email_domains table
    const { error: domainError } = await supabase
      .from('consultant_email_domains')
      .upsert(
        {
          domain: emailDomain,
          associated_company: clinic.mail_contact_company || 'Unknown',
          added_by: 'manual_tag',
          is_active: true,
        },
        {
          onConflict: 'domain',
        }
      );

    if (domainError) {
      console.error('Error adding domain:', domainError);
      // Don't fail if domain insert fails
    }

    // Update all other clinics with the same email domain
    const { error: bulkUpdateError } = await supabase
      .from('clinics_pending_review')
      .update({
        is_consultant: true,
        consultant_detection_method: 'auto_domain',
        consultant_email_domain: emailDomain,
        consultant_company: clinic.mail_contact_company,
      })
      .eq('consultant_email_domain', emailDomain)
      .neq('id', id);

    if (bulkUpdateError) {
      console.error('Error bulk updating clinics:', bulkUpdateError);
      // Don't fail if bulk update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Clinic tagged as consultant',
      domain: emailDomain,
    });
  } catch (error) {
    console.error('Error tagging consultant:', error);
    return NextResponse.json(
      { error: 'Failed to tag consultant' },
      { status: 500 }
    );
  }
}
