'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
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
  // Parse and validate historical funding data
  const fundingData = React.useMemo(() => {
    if (!historicalFunding || !Array.isArray(historicalFunding)) {
      return [];
    }

    return historicalFunding
      .filter((item): item is HistoricalFundingItem => {
        return item && typeof item === 'object' && 'year' in item && 'amount' in item;
      })
      .sort((a, b) => {
        // Sort by year descending (most recent first)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotal = () => {
    return fundingData.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const renderChangeIndicator = (change: number | null) => {
    if (change === null) return <Minus className="w-3 h-3 text-gray-400" />;
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const renderChangeText = (change: number | null) => {
    if (change === null) return null;
    const colorClass = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    return (
      <span className={`text-xs font-medium ${colorClass}`}>
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  if (layout === 'horizontal') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <DollarSign className="w-4 h-4" />
          <span>Historical Funding</span>
        </div>
        <div className="flex gap-4">
          {fundingData.map((item, index) => {
            const prevAmount = index < fundingData.length - 1 ? fundingData[index + 1]?.amount : null;
            const change = prevAmount ? calculateChange(item.amount, prevAmount) : null;

            return (
              <div key={item.year} className="flex-1">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-600 mb-1">
                    FY {item.year}
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {renderChangeIndicator(change)}
                    {renderChangeText(change)}
                  </div>
                </div>
              </div>
            );
          })}
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

  // Vertical layout
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <DollarSign className="w-4 h-4" />
        <span>Funding History</span>
      </div>
      <div className="space-y-2">
        {fundingData.map((item, index) => {
          const prevAmount = index < fundingData.length - 1 ? fundingData[index + 1]?.amount : null;
          const change = prevAmount ? calculateChange(item.amount, prevAmount) : null;

          return (
            <div
              key={item.year}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 min-w-[60px]">
                  FY {item.year}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {renderChangeIndicator(change)}
                {renderChangeText(change)}
              </div>
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
