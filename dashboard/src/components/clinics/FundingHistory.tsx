'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, DollarSign } from 'lucide-react';
import type { HistoricalFundingItem } from '@/types/database.types';

interface FundingHistoryProps {
  historicalFunding: HistoricalFundingItem[] | null;
  layout?: 'vertical' | 'horizontal';
  showTotal?: boolean;
}

export function FundingHistory({
  historicalFunding,
  layout = 'vertical',
  showTotal = true
}: FundingHistoryProps) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fundingData = React.useMemo(() => {
    if (!historicalFunding || !Array.isArray(historicalFunding)) {
      return [];
    }

    // Group by year and aggregate amounts (in case of duplicates)
    const byYear: Record<string, HistoricalFundingItem> = {};

    historicalFunding
      .filter((item): item is HistoricalFundingItem => {
        return item && typeof item === 'object' && 'year' in item && 'amount' in item;
      })
      .forEach(item => {
        if (!byYear[item.year]) {
          byYear[item.year] = {
            year: item.year,
            amount: 0,
            locations: []
          };
        }
        byYear[item.year].amount += item.amount || 0;

        // Merge locations if they exist
        if (item.locations && item.locations.length > 0) {
          byYear[item.year].locations = [
            ...(byYear[item.year].locations || []),
            ...item.locations
          ];
        }
      });

    // Convert to array and sort by year descending
    return Object.values(byYear).sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearB - yearA;
    });
  }, [historicalFunding]);

  if (fundingData.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No historical funding data
      </div>
    );
  }

  const calculateTotal = () => {
    return fundingData.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  if (layout === 'horizontal') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <DollarSign className="w-4 h-4" />
          <span>Historical Funding</span>
        </div>
        <div className="flex gap-4">
          {fundingData.map((item) => (
            <div key={`funding-${item.year}`} className="flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-600 mb-1">
                  FY {item.year}
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(item.amount)}
                </div>
                {item.locations && item.locations.length > 1 && (
                  <div className="text-xs text-blue-600 mt-1">
                    {item.locations.length} locations
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {showTotal && fundingData.length > 1 && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total ({fundingData.length} years)
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <DollarSign className="w-4 h-4" />
        <span>Funding History</span>
      </div>

      <div className="space-y-1">
        {fundingData.map(item => {
          const isExpanded = expandedYears.has(item.year);
          const hasLocations = item.locations && item.locations.length > 0;

          return (
            <div key={item.year} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => hasLocations && toggleYear(item.year)}
                disabled={!hasLocations}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  hasLocations
                    ? 'cursor-pointer hover:bg-gray-50'
                    : 'cursor-default bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasLocations ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-4 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-900">FY {item.year}</span>
                  {hasLocations && item.locations!.length > 1 && (
                    <span className="text-xs text-gray-500">
                      ({item.locations!.length} locations)
                    </span>
                  )}
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(item.amount)}
                </span>
              </button>

              {isExpanded && hasLocations && (
                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 space-y-2">
                  {item.locations!.map((location, idx) => (
                    <div
                      key={location.frn || idx}
                      className="flex items-start gap-2 text-xs"
                    >
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {location.name}
                        </div>
                        <div className="text-gray-600">
                          {location.street && <div>{location.street}</div>}
                          <div>
                            {location.city}
                            {location.city && location.state && ', '}
                            {location.state} {location.zip}
                          </div>
                        </div>
                        {location.frn && (
                          <div className="text-gray-500 mt-0.5">FRN: {location.frn}</div>
                        )}
                      </div>
                      <div className="font-medium text-green-600 flex-shrink-0">
                        {formatCurrency(location.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showTotal && fundingData.length > 1 && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-300">
          <span className="text-sm font-semibold text-gray-700">
            Total
          </span>
          <span className="text-base font-bold text-blue-700">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      )}
    </div>
  );
}
