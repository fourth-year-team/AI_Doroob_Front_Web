import { useI18n } from '../../i18n';
import { StatCard } from '../common/StatCard';

interface SummaryStatsProps {
  total: number;
  matches: number;
  mismatches: number;
  reviews: number;
  avgConfidence: number | null;
  correctRate: number | null;
}

export function SummaryStats({
  total,
  matches,
  mismatches,
  reviews,
  avgConfidence,
  correctRate,
}: SummaryStatsProps) {
  const { t } = useI18n();
  return (
    <div className="stats-row">
      <StatCard label={t('summary.totalVideos')} value={total} tone="accent" icon="video" />
      <StatCard label={t('stats.matches')} value={matches} tone="match" icon="check" />
      <StatCard label={t('stats.mismatches')} value={mismatches} tone="mismatch" icon="alert" />
      <StatCard label={t('stats.reviews')} value={reviews} tone="review" icon="warning" />
      <StatCard
        label={t('stats.avgConfidence')}
        value={avgConfidence != null ? `${Math.round(avgConfidence * 100)}%` : '—'}
        tone="info"
        icon="clock"
      />
      <StatCard
        label={t('summary.accuracy')}
        value={correctRate != null ? `${Math.round(correctRate * 100)}%` : '—'}
        tone={correctRate != null && correctRate >= 0.8 ? 'match' : 'review'}
        icon="check"
      />
    </div>
  );
}
