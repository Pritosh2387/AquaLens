import React from 'react';
import { cn } from '../../utils/cn';

export type StatusType =
  | 'online'
  | 'offline'
  | 'processing'
  | 'verified'
  | 'unverified'
  | 'warning'
  | 'critical'
  | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  className,
}) => {
  const statusStyles: Record<
    StatusType,
    { bg: string; text: string; border: string; dotColor: string }
  > = {
    online: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.3)',
      dotColor: '#10b981',
    },
    offline: {
      bg: 'rgba(148, 163, 184, 0.12)',
      text: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.3)',
      dotColor: '#64748b',
    },
    processing: {
      bg: 'rgba(6, 182, 212, 0.12)',
      text: '#22d3ee',
      border: 'rgba(6, 182, 212, 0.3)',
      dotColor: '#06b6d4',
    },
    verified: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.3)',
      dotColor: '#10b981',
    },
    unverified: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.3)',
      dotColor: '#f59e0b',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.3)',
      dotColor: '#f59e0b',
    },
    critical: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#f87171',
      border: 'rgba(239, 68, 68, 0.4)',
      dotColor: '#ef4444',
    },
    neutral: {
      bg: 'rgba(148, 163, 184, 0.1)',
      text: '#cbd5e1',
      border: 'rgba(148, 163, 184, 0.2)',
      dotColor: '#94a3b8',
    },
  };

  const style = statusStyles[status];
  const displayLabel = label || status.toUpperCase();

  return (
    <span
      className={cn('crystalline-badge text-xs px-2 py-0.5', className)}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            status === 'processing' || status === 'critical' ? 'animate-pulse' : ''
          )}
          style={{ backgroundColor: style.dotColor }}
        />
      )}
      {displayLabel}
    </span>
  );
};
