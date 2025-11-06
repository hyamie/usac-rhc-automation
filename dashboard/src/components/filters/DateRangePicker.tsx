'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESET_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = days === 0 ? to : subDays(to, days);
    onChange({ from, to });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value.from && !value.to) return 'Select date range';
    if (value.from && value.to) {
      return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`;
    }
    if (value.from) return `From ${format(value.from, 'MMM d, yyyy')}`;
    if (value.to) return `To ${format(value.to, 'MMM d, yyyy')}`;
    return 'Select date range';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        type="button"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {formatDateRange()}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px]">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Filter by Posting Date
              </h3>
              <div className="space-y-1">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.days)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-gray-200">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newFrom = e.target.value ? new Date(e.target.value) : null;
                      onChange({ ...value, from: newFrom });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newTo = e.target.value ? new Date(e.target.value) : null;
                      onChange({ ...value, to: newTo });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  type="button"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  type="button"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
