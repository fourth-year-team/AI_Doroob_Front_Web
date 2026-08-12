import { Icon, type IconName } from './Icon';

interface StatCardProps {
  label: string;
  value: string | number;
  tone: 'match' | 'mismatch' | 'review' | 'info' | 'accent' | 'neutral';
  icon?: IconName;
  sub?: string;
}

const TONES = {
  match: 'stat--match',
  mismatch: 'stat--mismatch',
  review: 'stat--review',
  info: 'stat--info',
  accent: 'stat--accent',
  neutral: '',
} as const;

export function StatCard({ label, value, tone, icon, sub }: StatCardProps) {
  return (
    <div className={`stat-card ${TONES[tone]}`}>
      <span className="stat-label">
        {icon && <Icon name={icon} size={13} />}
        {label}
      </span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
