'use client';

import React from 'react';
import { Building2, User } from 'lucide-react';

interface ConsultantBadgeProps {
  isConsultant: boolean;
  consultantCompany?: string | null;
  consultantEmailDomain?: string | null;
  detectionMethod?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function ConsultantBadge({
  isConsultant,
  consultantCompany,
  consultantEmailDomain,
  detectionMethod,
  size = 'md',
  showTooltip = true
}: ConsultantBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (isConsultant) {
    const tooltipText = showTooltip ? (
      `Consultant: ${consultantCompany || 'Unknown'}\n` +
      `Domain: ${consultantEmailDomain || 'N/A'}\n` +
      `Detection: ${detectionMethod || 'auto'}`
    ) : undefined;

    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`
            inline-flex items-center gap-1.5 font-medium rounded-full
            bg-purple-100 text-purple-700 border border-purple-200
            ${sizeClasses[size]}
          `}
          title={tooltipText}
        >
          <Building2 className={iconSizes[size]} />
          <span>Consultant</span>
        </span>
        {consultantCompany && (
          <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            ({consultantCompany})
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        bg-green-100 text-green-700 border border-green-200
        ${sizeClasses[size]}
      `}
      title={showTooltip ? 'Direct facility contact' : undefined}
    >
      <User className={iconSizes[size]} />
      <span>Direct</span>
    </span>
  );
}
