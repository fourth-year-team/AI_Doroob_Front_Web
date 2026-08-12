import { useI18n } from '../../i18n';
import { useData } from '../../state/DataContext';
import { ProgressBar } from '../common/ProgressBar';
import { Icon } from '../common/Icon';

export function AnalysisProgress() {
  const { t } = useI18n();
  const { running } = useData();

  if (!running) return null;

  const stageLabel =
    running.progress.stage === 'loading-video'
      ? t('analysis.progressLoading')
      : running.progress.stage === 'extracting'
        ? t('analysis.progressExtracting')
        : running.progress.stage === 'done'
          ? t('analysis.done')
          : t('analysis.progressProcessing');

  return (
    <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="refresh" size={15} className="spin" style={{ color: 'var(--accent)' }} />
          {t('analysis.running')}
          {running.videoId && (
            <span className="mono" style={{ color: 'var(--muted)' }}>
              {t('analysis.processingVideo', { videoId: running.videoId })}
            </span>
          )}
        </strong>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
          {Math.round(running.progress.percent)}%
        </span>
      </div>
      <ProgressBar percent={running.progress.percent} tone="info" />
      <div className="row" style={{ fontSize: 12, color: 'var(--muted)' }}>
        <span>{stageLabel}</span>
        {running.progress.currentFrame != null && (
          <span>· #{running.progress.currentFrame}</span>
        )}
        {running.batch && (
          <span>
            · {t('video.management')}: {running.batch.done}/{running.batch.total}
          </span>
        )}
      </div>
    </div>
  );
}
