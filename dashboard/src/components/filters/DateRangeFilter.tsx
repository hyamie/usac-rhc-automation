'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, startOfDay, subDays, addDays } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangeFilterProps {
  selectedDate: Date
  onChange: (date: Date) => void
  onRangeChange?: (from: Date, to: Date) => void
}

export function DateRangeFilter({ selectedDate, onChange, onRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'yesterday' | 'single' | 'range'>('yesterday')
  const [rangeFrom, setRangeFrom] = useState<Date | undefined>()
  const [rangeTo, setRangeTo] = useState<Date | undefined>()

  const yesterday = startOfDay(subDays(new Date(), 1))
  const isYesterday = selectedDate.getTime() === yesterday.getTime()

  const handleYesterday = () => {
    setMode('yesterday')
    onChange(yesterday)
    setIsOpen(false)
  }

  const handleSingleDate = (date: Date | undefined) => {
    if (date) {
      setMode('single')
      onChange(startOfDay(date))
      setIsOpen(false)
    }
  }

  const handleRangeSelect = () => {
    if (rangeFrom && rangeTo && onRangeChange) {
      setMode('range')
      onRangeChange(startOfDay(rangeFrom), addDays(startOfDay(rangeTo), 1))
      setIsOpen(false)
    }
  }

  const handlePreviousDay = () => {
    const prevDay = startOfDay(subDays(selectedDate, 1))
    setMode('single')
    onChange(prevDay)
  }

  const handleNextDay = () => {
    const nextDay = startOfDay(addDays(selectedDate, 1))
    const today = startOfDay(new Date())
    if (nextDay <= today) {
      setMode('single')
      onChange(nextDay)
    }
  }

  const getDisplayText = () => {
    if (mode === 'yesterday' && isYesterday) {
      return 'Yesterday'
    } else if (mode === 'range' && rangeFrom && rangeTo) {
      return `${format(rangeFrom, 'MMM d')} - ${format(rangeTo, 'MMM d, yyyy')}`
    } else {
      return format(selectedDate, 'MMM d, yyyy')
    }
  }

  const canGoNext = startOfDay(addDays(selectedDate, 1)) <= startOfDay(new Date())

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousDay}
        className="h-10 w-10"
        title="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 min-w-[200px] justify-between"
          >
            <Calendar className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left text-sm font-medium">
              {getDisplayText()}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-2">
          {/* Quick Actions */}
          <div className="space-y-1">
            <Button
              variant={mode === 'yesterday' && isYesterday ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={handleYesterday}
            >
              Yesterday
            </Button>
          </div>

          <div className="border-t pt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Select Single Date
            </p>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleSingleDate}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </div>

          {onRangeChange && (
            <div className="border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Select Date Range
              </p>
              <CalendarComponent
                mode="range"
                selected={{ from: rangeFrom, to: rangeTo }}
                onSelect={(range) => {
                  setRangeFrom(range?.from)
                  setRangeTo(range?.to)
                }}
                disabled={(date) => date > new Date()}
                numberOfMonths={2}
              />
              {rangeFrom && rangeTo && (
                <div className="px-2 pt-2">
                  <Button
                    className="w-full"
                    onClick={handleRangeSelect}
                  >
                    Apply Range
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        disabled={!canGoNext}
        className="h-10 w-10"
        title="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
