'use client';

import React from 'react';
import { Radio, Heart } from 'lucide-react';

interface ProgramToggleProps {
  value: 'Telecom' | 'Healthcare Connect' | 'All';
  onChange: (value: 'Telecom' | 'Healthcare Connect' | 'All') => void;
  className?: string;
}

export function ProgramToggle({ value, onChange, className = '' }: ProgramToggleProps) {
  const options = [
    { value: 'All' as const, label: 'All Programs', icon: null },
    { value: 'Telecom' as const, label: 'Telecom', icon: Radio },
    { value: 'Healthcare Connect' as const, label: 'Healthcare Connect', icon: Heart },
  ];

  return (
    <div className={`inline-flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${isActive
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
            type="button"
          >
            {Icon && <Icon className="w-4 h-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
