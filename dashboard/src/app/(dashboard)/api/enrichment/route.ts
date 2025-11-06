import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId } = body;

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      );
    }

    // TODO: Call n8n enrichment webhook
    const webhookUrl = process.env.N8N_ENRICHMENT_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes('REPLACE')) {
      return NextResponse.json(
        { error: 'Enrichment webhook not configured' },
        { status: 503 }
      );
    }

    // Call n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clinicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger enrichment workflow');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Enrichment API error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger enrichment' },
      { status: 500 }
    );
  }
}
