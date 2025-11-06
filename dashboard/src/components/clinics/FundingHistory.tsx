'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';

interface FundingYear {
  year: number | null;
  amount: number | null;
}

interface FundingHistoryProps {
  fundingYear1?: number | null;
  fundingAmount1?: number | null;
  fundingYear2?: number | null;
  fundingAmount2?: number | null;
  fundingYear3?: number | null;
  fundingAmount3?: number | null;
  totalFunding3y?: number | null;
  layout?: 'vertical' | 'horizontal';
  showTotal?: boolean;
}

export function FundingHistory({
  fundingYear1,
  fundingAmount1,
  fundingYear2,
  fundingAmount2,
  fundingYear3,
  fundingAmount3,
  totalFunding3y,
  layout = 'vertical',
  showTotal = true
}: FundingHistoryProps) {
  const fundingData: FundingYear[] = [
    { year: fundingYear1 ?? null, amount: fundingAmount1 ?? null },
    { year: fundingYear2 ?? null, amount: fundingAmount2 ?? null },
    { year: fundingYear3 ?? null, amount: fundingAmount3 ?? null },
  ].filter((item): item is FundingYear => item.year !== null && item.amount !== null);

  if (fundingData.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No historical funding data
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous || previous === 0) return null;
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
          <span>3-Year Funding History</span>
        </div>
        <div className="flex gap-4">
          {fundingData.map((item, index) => {
            const prevAmount = index > 0 ? fundingData[index - 1]?.amount : null;
            const change = calculateChange(item.amount, prevAmount);

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
        {showTotal && totalFunding3y && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total (3 years)
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(totalFunding3y)}
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
          const prevAmount = index > 0 ? fundingData[index - 1]?.amount : null;
          const change = calculateChange(item.amount, prevAmount);

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
      {showTotal && totalFunding3y && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-300">
          <span className="text-sm font-semibold text-gray-700">
            Total
          </span>
          <span className="text-base font-bold text-blue-700">
            {formatCurrency(totalFunding3y)}
          </span>
        </div>
      )}
    </div>
  );
}
