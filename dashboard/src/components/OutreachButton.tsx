'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateOutreachEmail } from '@/lib/outreach';
import { toast } from 'sonner';
import { Loader2, Mail, ExternalLink } from 'lucide-react';

interface OutreachButtonProps {
  clinicId: string;
  clinicName: string;
  contactEmail?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function OutreachButton({
  clinicId,
  clinicName,
  contactEmail,
  disabled = false,
  onSuccess,
}: OutreachButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleStartOutreach = async () => {
    if (!contactEmail) {
      toast.error('No contact email available for this clinic');
      return;
    }

    try {
      setLoading(true);

      // Get user ID (in production, get from auth)
      const userId = 'user-id-placeholder'; // TODO: Get from auth context

      // Call n8n workflow
      const result = await generateOutreachEmail(clinicId, userId);

      // Show success notification
      toast.success('Draft Created!', {
        description: `Template ${result.template_variant} - ${result.subject}`,
        action: {
          label: 'Open in Outlook',
          onClick: () => window.open(result.draft_url, '_blank'),
        },
        duration: 10000,
      });

      // Open draft in new tab
      window.open(result.draft_url, '_blank');

      // Callback for parent component to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Outreach error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      toast.error('Failed to Create Draft', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartOutreach}
      disabled={disabled || loading || !contactEmail}
      className="gap-2"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating Draft...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4" />
          Start Outreach
        </>
      )}
    </Button>
  );
}

/**
 * Compact version for use in table rows
 */
export function OutreachButtonCompact({
  clinicId,
  clinicName,
  contactEmail,
  disabled = false,
  onSuccess,
}: OutreachButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleStartOutreach = async () => {
    if (!contactEmail) {
      toast.error('No contact email');
      return;
    }

    try {
      setLoading(true);
      const userId = 'user-id-placeholder';
      const result = await generateOutreachEmail(clinicId, userId);

      toast.success('Draft ready', {
        action: {
          label: 'Open',
          onClick: () => window.open(result.draft_url, '_blank'),
        },
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartOutreach}
      disabled={disabled || loading || !contactEmail}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="Start Outreach"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
    </Button>
  );
}
