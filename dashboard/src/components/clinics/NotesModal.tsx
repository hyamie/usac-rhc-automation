'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, Calendar, List, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { TimelineView } from './TimelineView'
import type { NoteItem } from '@/types/database.types'

interface NotesModalProps {
  clinicId: string
  clinicName: string
  notes: NoteItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function NotesModal({
  clinicId,
  clinicName,
  notes,
  open,
  onOpenChange,
  onUpdate,
}: NotesModalProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  // Sort notes by timestamp (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/clinics/${clinicId}/add-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: newNoteText.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      // Reset form
      setNewNoteText('')
      setIsAdding(false)

      // Call update callback to refresh the clinic data
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNewNoteText('')
    setIsAdding(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Notes</DialogTitle>
              <DialogDescription>{clinicName}</DialogDescription>
            </div>
            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-lg p-1 bg-muted/50">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="h-8 px-3"
                title="Timeline View"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Add Note Button */}
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              className="w-full mb-4"
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}

          {/* Add Note Form */}
          {isAdding && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">New Note</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Enter your note here..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="mb-3 min-h-[100px]"
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddNote}
                  disabled={!newNoteText.trim() || isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Notes Display */}
          <div className="flex-1 min-h-0">
            {sortedNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No notes yet.</p>
                <p className="text-sm mt-2">Click "Add Note" to create your first note.</p>
              </div>
            ) : viewMode === 'timeline' ? (
              <ScrollArea className="h-full pr-4">
                <TimelineView notes={sortedNotes} />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {sortedNotes.map((noteItem, index) => (
                    <div
                      key={`${noteItem.timestamp}-${index}`}
                      className="border rounded-lg p-4 bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(noteItem.timestamp)}</span>
                          <span className="text-gray-400">
                            {new Date(noteItem.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{noteItem.note}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
