import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Toggle Primary Contact Consultant Tag
 *
 * Toggles the contact_is_consultant field for the primary contact
 * This affects routing in the Part 2 workflow (different email template)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid clinic ID format' },
        { status: 400 }
      )
    }

    // Get current value
    const { data: currentClinic, error: fetchError } = await supabase
      .from('clinics_pending_review')
      .select('contact_is_consultant')
      .eq('id', id)
      .single()

    if (fetchError || !currentClinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Toggle the value
    const newValue = !currentClinic.contact_is_consultant

    // Update the clinic
    const { data, error } = await supabase
      .from('clinics_pending_review')
      .update({
        contact_is_consultant: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling primary consultant tag:', error)
      return NextResponse.json(
        { error: 'Failed to update consultant tag', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      isConsultant: newValue,
      message: newValue
        ? 'Primary contact tagged as consultant'
        : 'Consultant tag removed from primary contact'
    })

  } catch (error) {
    console.error('Unexpected error in tag-primary-consultant route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
