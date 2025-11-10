'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type StateFilterValue = 'all' | string;

interface StateFilterProps {
  value: StateFilterValue;
  onChange: (value: StateFilterValue) => void;
  className?: string;
}

// US States list
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function StateFilter({
  value,
  onChange,
  className = '',
}: StateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStates = searchTerm
    ? US_STATES.filter(state => state.toLowerCase().includes(searchTerm.toLowerCase()))
    : US_STATES;

  const currentLabel = value === 'all' ? 'All States' : value;

  const handleSelect = (state: StateFilterValue) => {
    onChange(state);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-background border rounded-lg hover:bg-accent transition-colors shadow-sm min-w-[160px]"
        type="button"
      >
        <MapPin className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left text-sm font-medium">
          {currentLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />
          <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 min-w-[240px] max-w-[280px]">
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {/* All States Option */}
              <button
                onClick={() => handleSelect('all')}
                className={`
                  w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left
                  ${value === 'all'
                    ? 'bg-accent border border-primary/20'
                    : 'hover:bg-accent border border-transparent'
                  }
                `}
                type="button"
              >
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${value === 'all' ? 'text-primary' : ''}`}>
                    All States
                  </span>
                </div>
              </button>

              {/* Divider */}
              {filteredStates.length > 0 && (
                <div className="h-px bg-border my-2" />
              )}

              {/* State Options */}
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => {
                  const isActive = value === state;

                  return (
                    <button
                      key={state}
                      onClick={() => handleSelect(state)}
                      className={`
                        w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left
                        ${isActive
                          ? 'bg-accent border border-primary/20'
                          : 'hover:bg-accent border border-transparent'
                        }
                      `}
                      type="button"
                    >
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                          {state}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No states found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
