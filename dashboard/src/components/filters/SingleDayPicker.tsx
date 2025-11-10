'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, startOfDay } from 'date-fns';

interface SingleDayPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function SingleDayPicker({ value, onChange, className = '' }: SingleDayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrevDay = () => {
    onChange(subDays(value, 1));
  };

  const handleNextDay = () => {
    onChange(addDays(value, 1));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = startOfDay(new Date(e.target.value));
      onChange(newDate);
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    if (days === 0) {
      onChange(startOfDay(new Date()));
    } else {
      onChange(subDays(startOfDay(new Date()), days));
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {/* Previous Day Button */}
      <button
        onClick={handlePrevDay}
        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        type="button"
        title="Previous day"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      {/* Date Display/Picker */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm min-w-[160px] justify-center"
          type="button"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {format(value, 'MMM d, yyyy')}
          </span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[240px]">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Filter by Filing Date
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleQuickSelect(0)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleQuickSelect(1)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    type="button"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => handleQuickSelect(7)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    type="button"
                  >
                    Last Week
                  </button>
                </div>
              </div>

              <div className="p-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={format(value, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Next Day Button */}
      <button
        onClick={handleNextDay}
        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        type="button"
        title="Next day"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}
