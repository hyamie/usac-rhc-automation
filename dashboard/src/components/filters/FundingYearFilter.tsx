'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

type FundingYearFilterValue = 'all' | '2025' | '2026';

interface FundingYearFilterProps {
  value: FundingYearFilterValue;
  onChange: (value: FundingYearFilterValue) => void;
  className?: string;
}

export function FundingYearFilter({
  value,
  onChange,
  className = '',
}: FundingYearFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    {
      value: 'all' as const,
      label: 'All Years',
      description: 'Show all funding years',
    },
    {
      value: '2025' as const,
      label: 'FY 2025',
      description: 'Funding Year 2025',
    },
    {
      value: '2026' as const,
      label: 'FY 2026',
      description: 'Funding Year 2026',
    },
  ];

  const currentOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-background border rounded-lg hover:bg-accent transition-colors shadow-sm min-w-[160px]"
        type="button"
      >
        <Calendar className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left text-sm font-medium">
          {currentOption.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2">
              {options.map((option) => {
                const isActive = value === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-colors text-left
                      ${isActive
                        ? 'bg-accent border border-primary/20'
                        : 'hover:bg-accent border border-transparent'
                      }
                    `}
                    type="button"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                          {option.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
