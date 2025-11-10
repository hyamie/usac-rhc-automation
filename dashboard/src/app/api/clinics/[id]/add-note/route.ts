import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NoteItem } from '@/types/database.types'

/**
 * API Route: Add Note to Clinic
 *
 * Appends a new note to the clinic's notes JSONB array
 * Notes are stored as: [{ timestamp: string, note: string }]
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

    // Parse request body
    const body = await request.json()
    const { note } = body

    if (!note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      )
    }

    // Get current clinic data
    const { data: clinic, error: fetchError } = await supabase
      .from('clinics_pending_review')
      .select('notes')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching clinic:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch clinic', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Prepare new note object
    const newNote: NoteItem = {
      timestamp: new Date().toISOString(),
      note: note.trim(),
    }

    // Get existing notes or initialize empty array
    const existingNotes = (clinic.notes as NoteItem[] | null) || []

    // Append new note to the array
    const updatedNotes = [...existingNotes, newNote]

    // Update the clinic with the new notes array
    const { data, error: updateError } = await supabase
      .from('clinics_pending_review')
      .update({
        notes: updatedNotes as any, // Cast to any to satisfy Supabase type checking
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('notes')
      .single()

    if (updateError) {
      console.error('Error updating notes:', updateError)
      return NextResponse.json(
        { error: 'Failed to add note', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        notes: data.notes,
      },
      message: 'Note added successfully',
    })

  } catch (error) {
    console.error('Unexpected error in add-note route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
