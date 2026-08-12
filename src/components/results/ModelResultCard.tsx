import type { AggregatedResult, FrameResult, ModelType } from '../../types';
import { useI18n } from '../../i18n';
import { Badge, verdictBadgeTone } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Icon, type IconName } from '../common/Icon';

interface ModelResultCardProps {
  modelType: ModelType;
  title: string;
  icon: IconName;
  agg: AggregatedResult;
  frames: FrameResult[];
  threshold: number;
}

export function ModelResultCard({ modelType, title, icon, agg, frames, threshold }: ModelResultCardProps) {
  const { t } = useI18n();
  const sorted = [...frames].sort((a, b) => a.frame_id - b.frame_id);

  return (
    <div className="card card--pad model-result">
      <div className="model-result-head">
        <h4>
          <Icon name={icon} size={16} />
          <span style={{ color: 'var(--accent)' }}>{title}</span>
        </h4>
        <Badge tone={verdictBadgeTone(agg.matched)}>
          {t(`decision.${agg.matched.toLowerCase()}`)}
        </Badge>
      </div>

      <div className="final-row">
        <div>
          <div className="cs-label" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05, color: 'var(--muted)' }}>
            {t('results.finalPrediction')}
          </div>
          <div className="final-value mono">{agg.final_predicted_value || '—'}</div>
        </div>
        <div className="conf-bar">
          <ProgressBar percent={Math.min(100, agg.confidence * 100)} />
          <span className="conf-num">{Math.round(agg.confidence * 100)}%</span>
        </div>
      </div>

      <div className="row" style={{ fontSize: 11.5, color: 'var(--muted)', gap: 6 }}>
        <span className="badge badge--neutral">
          {t('results.method')}: {t(`settings.${agg.method === 'majority' ? 'aggregationMajority' : 'aggregationHighest'}`)}
        </span>
        <span className="badge badge--neutral">
          {t('results.processedFrames')}: {agg.processedFrames}
        </span>
        <span className="badge badge--neutral">
          {t('results.excludedFrames')}: {agg.excludedFrames}
        </span>
        {agg.method === 'majority' && Object.entries(agg.votes).length > 1 && (
          <span className="badge badge--accent">
            {Object.entries(agg.votes)
              .map(([v, c]) => `${v} ×${c}`)
              .join(' · ')}
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('results.frame')}</th>
              <th>{t('results.timestamp')}</th>
              <th>{t('results.prediction')}</th>
              <th>{t('results.confidence')}</th>
              <th>{t('results.votingResult')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => {
              const passes = f.confidence_score >= threshold && f.predicted_value.trim() !== '';
              return (
                <tr key={`${modelType}-${f.frame_id}`} style={{ opacity: passes ? 1 : 0.62 }}>
                  <td className="mono">#{f.frame_id}</td>
                  <td className="mono">{f.timestamp.toFixed(2)}s</td>
                  <td className="mono">{f.predicted_value || '—'}</td>
                  <td>
                    <span className="conf-bar" style={{ minWidth: 90 }}>
                      <ProgressBar percent={Math.min(100, f.confidence_score * 100)} tone={passes ? 'accent' : 'info'} />
                      <span className="conf-num">{Math.round(f.confidence_score * 100)}%</span>
                    </span>
                  </td>
                  <td>
                    {passes ? (
                      <Badge tone="match">{t('results.included')}</Badge>
                    ) : (
                      <Badge tone="review">{t('results.excluded')}</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
