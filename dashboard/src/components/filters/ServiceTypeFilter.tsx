'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ServiceTypeFilterValue = 'all' | string;

interface ServiceTypeFilterProps {
  value: ServiceTypeFilterValue;
  onChange: (value: ServiceTypeFilterValue) => void;
  className?: string;
}

// Request for Services options based on USAC Form 465
const SERVICE_TYPES = [
  { value: 'telecommunications_only', label: 'Telecommunications Service ONLY' },
  { value: 'both', label: 'Both Telecommunications & Internet Services' },
  { value: 'voice', label: 'Voice' },
  { value: 'data', label: 'Data' },
  { value: 'other', label: 'Other' },
];

export function ServiceTypeFilter({
  value,
  onChange,
  className = '',
}: ServiceTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = searchTerm
    ? SERVICE_TYPES.filter(service =>
        service.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : SERVICE_TYPES;

  const currentOption = SERVICE_TYPES.find(opt => opt.value === value);
  const currentLabel = value === 'all' ? 'All Services' : (currentOption?.label || 'All Services');

  const handleSelect = (serviceValue: ServiceTypeFilterValue) => {
    onChange(serviceValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-background border rounded-lg hover:bg-accent transition-colors shadow-sm min-w-[200px]"
        type="button"
      >
        <FileText className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left text-sm font-medium truncate">
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
          <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 min-w-[320px] max-w-[400px]">
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search all values"
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
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {/* Header */}
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Value Most Common to Least Common
              </div>

              {/* All Services Option */}
              <button
                onClick={() => handleSelect('all')}
                className={`
                  w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                  ${value === 'all'
                    ? 'bg-accent border border-primary/20'
                    : 'hover:bg-accent border border-transparent'
                  }
                `}
                type="button"
              >
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${value === 'all' ? 'text-primary font-medium' : 'italic text-muted-foreground'}`}>
                    (No value)
                  </span>
                </div>
              </button>

              {/* Service Type Options */}
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isActive = value === service.value;

                  return (
                    <button
                      key={service.value}
                      onClick={() => handleSelect(service.value)}
                      className={`
                        w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                        ${isActive
                          ? 'bg-accent border border-primary/20'
                          : 'hover:bg-accent border border-transparent'
                        }
                      `}
                      type="button"
                    >
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${isActive ? 'text-primary font-medium' : ''}`}>
                          {service.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No services found
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-2 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  onChange('all');
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
