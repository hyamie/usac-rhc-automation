import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinicId, hcpNumber, clinicName } = body

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      )
    }

    // Get webhook URL from environment
    const webhookUrl = process.env.N8N_ENRICHMENT_WEBHOOK_URL
    const webhookToken = process.env.N8N_WEBHOOK_TOKEN

    if (!webhookUrl || webhookUrl.includes('REPLACE')) {
      return NextResponse.json(
        { 
          error: 'Enrichment webhook not configured. Please import n8n workflows first.',
          message: 'The n8n enrichment workflow has not been set up yet.'
        },
        { status: 503 }
      )
    }

    // Supabase client (for future updates if needed)
    const supabase = await createClient()

    // Call n8n enrichment webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookToken && { 'Authorization': `Bearer ${webhookToken}` }),
      },
      body: JSON.stringify({
        clinicId,
        hcpNumber,
        clinicName,
      }),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('n8n webhook error:', errorText)
      throw new Error('Failed to trigger enrichment workflow')
    }

    const result = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Enrichment workflow triggered successfully',
      data: result,
    })
  } catch (error) {
    console.error('Enrichment API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger enrichment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
