interface ProgressBarProps {
  percent: number;
  tone?: 'accent' | 'info';
}

export function ProgressBar({ percent, tone = 'accent' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className={`progress ${tone === 'info' ? 'progress--info' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
