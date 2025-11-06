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
      .select('consultant_email_domain')
      .eq('id', id)
      .single();

    if (fetchError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    const emailDomain = clinic.consultant_email_domain;

    // Update the clinic record
    const { error: updateError } = await supabase
      .from('clinics_pending_review')
      .update({
        is_consultant: false,
        consultant_detection_method: 'manual_untagged',
        consultant_email_domain: null,
        consultant_company: null,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Optionally deactivate the domain in consultant_email_domains table
    if (emailDomain) {
      const { error: domainError } = await supabase
        .from('consultant_email_domains')
        .update({
          is_active: false,
          notes: 'Manually untagged',
        })
        .eq('domain', emailDomain);

      if (domainError) {
        console.error('Error deactivating domain:', domainError);
        // Don't fail if domain update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Consultant tag removed',
    });
  } catch (error) {
    console.error('Error untagging consultant:', error);
    return NextResponse.json(
      { error: 'Failed to untag consultant' },
      { status: 500 }
    );
  }
}
