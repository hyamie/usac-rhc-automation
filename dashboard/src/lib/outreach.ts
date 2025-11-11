/**
 * Outreach Email Generation API Client
 * Connects to n8n workflow for AI-powered email drafts
 */

export interface OutreachRequest {
  clinic_id: string;
  user_id: string;
}

export interface OutreachResponse {
  success: boolean;
  draft_url: string;
  draft_id: string;
  template_variant: 'A' | 'B' | 'C';
  instance_id: string;
  enrichment_preview: string;
  subject: string;
  generated_at: string;
}

export interface OutreachError {
  success: false;
  error: string;
  error_node?: string;
  timestamp: string;
}

/**
 * Generate personalized outreach email draft using n8n workflow
 *
 * @param clinicId - UUID of the clinic
 * @param userId - UUID of the current user
 * @returns Promise with draft URL and metadata
 * @throws Error if workflow fails
 */
export async function generateOutreachEmail(
  clinicId: string,
  userId: string
): Promise<OutreachResponse> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_OUTREACH_WEBHOOK_URL;
  const authToken = process.env.NEXT_PUBLIC_N8N_WEBHOOK_AUTH_TOKEN;

  if (!webhookUrl) {
    throw new Error('N8N_OUTREACH_WEBHOOK_URL not configured');
  }

  if (!authToken) {
    throw new Error('N8N_WEBHOOK_AUTH_TOKEN not configured');
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': authToken,
      },
      body: JSON.stringify({
        clinic_id: clinicId,
        user_id: userId,
      } as OutreachRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Workflow failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      const error = data as OutreachError;
      throw new Error(error.error || 'Unknown workflow error');
    }

    return data as OutreachResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate outreach email');
  }
}

/**
 * Get outreach history for a clinic
 *
 * @param clinicId - UUID of the clinic
 * @returns Promise with array of email instances
 */
export async function getOutreachHistory(clinicId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/email_instances?clinic_id=eq.${clinicId}&order=created_at.desc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch outreach history');
  }

  return response.json();
}

/**
 * Get current active templates
 *
 * @returns Promise with array of active templates
 */
export async function getActiveTemplates() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  // Get current week version
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  const weekVersion = `week-${weekNumber}-${today.getFullYear()}`;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/email_templates?active=eq.true&version=eq.${weekVersion}&order=template_variant.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

/**
 * Get template performance stats
 *
 * @param weekVersion - Week version (e.g., 'week-46-2025')
 * @returns Promise with performance data
 */
export async function getTemplatePerformance(weekVersion?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  // If no week version provided, get current week
  if (!weekVersion) {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    weekVersion = `week-${weekNumber}-${today.getFullYear()}`;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/email_templates?version=eq.${weekVersion}&select=template_variant,times_used,avg_open_rate,avg_response_rate`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch performance data');
  }

  return response.json();
}
