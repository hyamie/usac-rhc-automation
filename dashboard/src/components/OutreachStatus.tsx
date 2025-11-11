'use client';

import { useEffect, useState } from 'react';
import { getOutreachHistory } from '@/lib/outreach';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Mail,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailInstance {
  id: string;
  subject_rendered: string;
  draft_url: string;
  draft_created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  responded_at: string | null;
  template_variant: 'A' | 'B' | 'C';
  enrichment_data: {
    context: string;
    source: string;
  };
  user_edited: boolean;
}

interface OutreachStatusProps {
  clinicId: string;
}

export function OutreachStatus({ clinicId }: OutreachStatusProps) {
  const [history, setHistory] = useState<EmailInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [clinicId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOutreachHistory(clinicId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Outreach Status
          </CardTitle>
          <CardDescription>No outreach emails yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click "Start Outreach" to generate your first personalized email draft.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestEmail = history[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Outreach Status
        </CardTitle>
        <CardDescription>
          {history.length} email{history.length !== 1 ? 's' : ''} generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest Email */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Template {latestEmail.template_variant}</Badge>
                {latestEmail.user_edited && (
                  <Badge variant="secondary">Edited</Badge>
                )}
                {getStatusBadge(latestEmail)}
              </div>
              <p className="text-sm font-medium">{latestEmail.subject_rendered}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(latestEmail.draft_created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(latestEmail.draft_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Enrichment Preview */}
          {latestEmail.enrichment_data?.context && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>AI Context:</strong> {latestEmail.enrichment_data.context.substring(0, 150)}
                {latestEmail.enrichment_data.context.length > 150 && '...'}
              </p>
            </div>
          )}

          {/* Status Timeline */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Draft Created
            </div>
            {latestEmail.sent_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                Sent
              </div>
            )}
            {latestEmail.opened_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Opened
              </div>
            )}
            {latestEmail.responded_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Responded
              </div>
            )}
          </div>
        </div>

        {/* Previous Emails */}
        {history.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Previous Outreach</p>
            {history.slice(1, 4).map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {email.template_variant}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(email.draft_created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {getStatusBadge(email)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(email.draft_url, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {history.length > 4 && (
              <p className="text-xs text-muted-foreground text-center">
                + {history.length - 4} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusBadge(email: EmailInstance) {
  if (email.responded_at) {
    return <Badge className="bg-green-600">Responded</Badge>;
  }
  if (email.opened_at) {
    return <Badge className="bg-green-500">Opened</Badge>;
  }
  if (email.sent_at) {
    return <Badge className="bg-blue-500">Sent</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}
