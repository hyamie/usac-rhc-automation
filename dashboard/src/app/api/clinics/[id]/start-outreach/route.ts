import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Start Outreach for Clinic
 *
 * Updates the clinic's outreach_status to 'ready_for_outreach'
 * This marks the clinic as ready to be processed by Part 2 of the n8n workflow
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

    // Update the clinic's outreach status
    const { data, error } = await supabase
      .from('clinics_pending_review')
      .update({
        outreach_status: 'ready_for_outreach',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating outreach status:', error)
      return NextResponse.json(
        { error: 'Failed to update outreach status', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Clinic marked as ready for outreach'
    })

  } catch (error) {
    console.error('Unexpected error in start-outreach route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
