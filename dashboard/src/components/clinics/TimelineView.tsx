'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, FileText, Send, Tag, CheckCircle2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { NoteItem } from '@/types/database.types'

interface TimelineEvent {
  id: string
  type: 'note' | 'outreach' | 'tag' | 'status'
  timestamp: Date
  content: string
  user?: string
  metadata?: any
}

interface TimelineViewProps {
  notes: NoteItem[]
  outreachStatus?: string
  createdAt?: string
  updatedAt?: string
}

export function TimelineView({ notes, outreachStatus, createdAt, updatedAt }: TimelineViewProps) {
  const [expanded, setExpanded] = useState(false)

  // Build timeline events from notes and metadata
  const events: TimelineEvent[] = [
    // Add notes as events
    ...notes.map((note, index) => ({
      id: `note-${index}`,
      type: 'note' as const,
      timestamp: new Date(note.timestamp),
      content: note.note,
    })),
    // Add created event if available
    ...(createdAt ? [{
      id: 'created',
      type: 'status' as const,
      timestamp: new Date(createdAt),
      content: 'Clinic record created',
    }] : []),
  ]

  // Sort by timestamp descending (newest first)
  const sortedEvents = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Show only first 3 events unless expanded
  const visibleEvents = expanded ? sortedEvents : sortedEvents.slice(0, 3)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'outreach':
        return <Send className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
      case 'status':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'text-blue-600 dark:text-blue-400'
      case 'outreach':
        return 'text-orange-600 dark:text-orange-400'
      case 'tag':
        return 'text-purple-600 dark:text-purple-400'
      case 'status':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activity yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="space-y-4">
        {visibleEvents.map((event, index) => (
          <div key={event.id} className="flex gap-4 group">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              <div className={`
                rounded-full p-2 border-2 bg-background
                ${getEventColor(event.type)}
                transition-all duration-200
                group-hover:scale-110
              `}>
                {getEventIcon(event.type)}
              </div>
              {index < visibleEvents.length - 1 && (
                <div className="w-0.5 h-full bg-border my-1" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(event.timestamp, 'MMM d, yyyy')} at {format(event.timestamp, 'h:mm a')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {event.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse button */}
      {sortedEvents.length > 3 && (
        <div className="text-center pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? `Show Less`
              : `Show ${sortedEvents.length - 3} More ${sortedEvents.length - 3 === 1 ? 'Event' : 'Events'}`
            }
          </Button>
        </div>
      )}
    </div>
  )
}
