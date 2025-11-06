'use client';

import React, { useState } from 'react';
import { Users, Building2, UserCheck, ChevronDown } from 'lucide-react';

type ConsultantFilterValue = 'all' | 'direct' | 'consultant';

interface ConsultantFilterProps {
  value: ConsultantFilterValue;
  onChange: (value: ConsultantFilterValue) => void;
  className?: string;
  counts?: {
    all: number;
    direct: number;
    consultant: number;
  };
}

export function ConsultantFilter({
  value,
  onChange,
  className = '',
  counts
}: ConsultantFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    {
      value: 'all' as const,
      label: 'All Contacts',
      icon: Users,
      description: 'Show all filings',
      color: 'text-gray-600',
    },
    {
      value: 'direct' as const,
      label: 'Direct Only',
      icon: Building2,
      description: 'Facility contacts only',
      color: 'text-green-600',
    },
    {
      value: 'consultant' as const,
      label: 'Consultants Only',
      icon: UserCheck,
      description: 'Telecom consultants only',
      color: 'text-purple-600',
    },
  ];

  const currentOption = options.find(opt => opt.value === value) || options[0];
  const Icon = currentOption.icon;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm min-w-[200px]"
        type="button"
      >
        <Icon className={`w-4 h-4 ${currentOption.color}`} />
        <span className="flex-1 text-left text-sm font-medium text-gray-700">
          {currentOption.label}
        </span>
        {counts && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {counts[value]}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px]">
            <div className="p-2">
              {options.map((option) => {
                const OptionIcon = option.icon;
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
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                    type="button"
                  >
                    <OptionIcon className={`w-5 h-5 mt-0.5 ${option.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {option.label}
                        </span>
                        {counts && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {counts[option.value]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
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
