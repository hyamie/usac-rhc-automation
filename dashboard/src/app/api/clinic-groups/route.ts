import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { group_name, primary_clinic_id, clinic_ids } = body

    // Validate input
    if (!group_name || !primary_clinic_id || !clinic_ids || clinic_ids.length < 2) {
      return NextResponse.json(
        { error: 'Invalid input: group_name, primary_clinic_id, and at least 2 clinic_ids required' },
        { status: 400 }
      )
    }

    // 1. Fetch all selected clinics to calculate totals
    const { data: clinics, error: fetchError } = await supabase
      .from('clinics_pending_review')
      .select('*')
      .in('id', clinic_ids)

    if (fetchError) {
      console.error('Error fetching clinics:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch clinic data' },
        { status: 500 }
      )
    }

    // Calculate total funding and location count
    let totalFunding = 0
    const locationCount = clinics.length

    clinics.forEach((clinic) => {
      if (clinic.historical_funding) {
        try {
          const funding = clinic.historical_funding as Array<{ year: string; amount: number }>
          totalFunding += funding.reduce((sum, item) => sum + (item.amount || 0), 0)
        } catch (error) {
          console.error('Error parsing historical_funding:', error)
        }
      }
    })

    // 2. Create the clinic group
    const { data: newGroup, error: groupError } = await supabase
      .from('clinic_groups')
      .insert({
        group_name,
        primary_clinic_id,
        total_funding_amount: totalFunding,
        location_count: locationCount,
        created_by: 'user-placeholder', // TODO: Get from auth
      })
      .select()
      .single()

    if (groupError) {
      console.error('Error creating group:', groupError)
      return NextResponse.json(
        { error: 'Failed to create clinic group', details: groupError.message },
        { status: 500 }
      )
    }

    // 3. Add clinic group members
    const members = clinic_ids.map((clinic_id: string) => ({
      group_id: newGroup.id,
      clinic_id,
    }))

    const { error: membersError } = await supabase
      .from('clinic_group_members')
      .insert(members)

    if (membersError) {
      console.error('Error adding group members:', membersError)
      // Rollback: delete the group
      await supabase.from('clinic_groups').delete().eq('id', newGroup.id)
      return NextResponse.json(
        { error: 'Failed to add group members', details: membersError.message },
        { status: 500 }
      )
    }

    // 4. Update clinics to reference the group
    const { error: updateError } = await supabase
      .from('clinics_pending_review')
      .update({ belongs_to_group_id: newGroup.id })
      .in('id', clinic_ids)

    if (updateError) {
      console.error('Error updating clinics:', updateError)
      // Don't rollback - the group is created, just log the error
      console.warn('Group created but failed to update clinic references')
    }

    return NextResponse.json({
      success: true,
      group: newGroup,
      members_added: clinic_ids.length,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/clinic-groups:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    if (groupId) {
      // Get specific group with members
      const { data: group, error: groupError } = await supabase
        .from('clinic_groups')
        .select(`
          *,
          primary_clinic:clinics_pending_review!primary_clinic_id(*),
          members:clinic_group_members(
            clinic:clinics_pending_review(*)
          )
        `)
        .eq('id', groupId)
        .single()

      if (groupError) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ group })
    } else {
      // Get all groups
      const { data: groups, error } = await supabase
        .from('clinic_groups')
        .select(`
          *,
          primary_clinic:clinics_pending_review!primary_clinic_id(clinic_name, city, state),
          members:clinic_group_members(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch groups' },
          { status: 500 }
        )
      }

      return NextResponse.json({ groups })
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/clinic-groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
