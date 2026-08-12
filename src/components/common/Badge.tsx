import React from 'react';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'match' | 'mismatch' | 'review' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  tone: BadgeTone;
  icon?: IconName;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone, icon, children, className }: BadgeProps) {
  const toneClass =
    tone === 'match'
      ? 'badge--match'
      : tone === 'mismatch'
        ? 'badge--mismatch'
        : tone === 'review'
          ? 'badge--review'
          : tone === 'info'
            ? 'badge--info'
            : tone === 'accent'
              ? 'badge--accent'
              : 'badge--neutral';
  return (
    <span className={`badge ${toneClass} ${className ?? ''}`}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

export function verdictBadgeTone(verdict: 'MATCH' | 'MISMATCH' | 'UNCLEAR' | string): BadgeTone {
  switch (verdict) {
    case 'MATCH':
      return 'match';
    case 'MISMATCH':
      return 'mismatch';
    case 'UNCLEAR':
      return 'review';
    default:
      return 'neutral';
  }
}
