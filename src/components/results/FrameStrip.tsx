import { useI18n } from '../../i18n';
import { useFrameImages } from '../../hooks/useFrameImages';
import { useData } from '../../state/DataContext';
import type { AnalysisSession, FrameResult } from '../../types';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icon';

interface FrameStripProps {
  session: AnalysisSession;
  frames: FrameResult[];
}

export function FrameStrip({ session, frames }: FrameStripProps) {
  const { t } = useI18n();
  const { settings } = useData();
  const { frames: images, loading, error } = useFrameImages(session.video_path, settings);

  const plateByFrame = new Map<number, FrameResult>();
  for (const f of frames) {
    if (f.model_type === 'plate') plateByFrame.set(f.frame_id, f);
  }

  const count = session.frameCount || frames.length || images.length;

  return (
    <div className="stack">
      <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="camera" size={15} />
          <span style={{ color: 'var(--accent)' }}>{t('results.representative')}</span>
        </h3>
        {session.representativeFrame ? (
          <img
            src={session.representativeFrame}
            alt={t('results.representative')}
            style={{
              width: '100%',
              maxWidth: 640,
              borderRadius: 12,
              border: '1px solid var(--border)',
              display: 'block',
            }}
          />
        ) : (
          <div className="empty-state" style={{ padding: 32 }}>
            <Icon name="video" size={22} />
            <p>{t('results.noFrames')}</p>
          </div>
        )}
      </div>

      <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="list" size={15} />
            <span style={{ color: 'var(--accent)' }}>{t('results.extractedFrames')}</span>
          </h3>
          <span className="badge badge--neutral">{count} {t('settings.frames')}</span>
        </div>

        {loading ? (
          <div className="frame-strip">
            {Array.from({ length: Math.min(6, count) }).map((_, i) => (
              <div key={i} className="frame-cell">
                <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="frame-strip">
            {images.map((img) => {
              const plate = plateByFrame.get(img.index);
              const passes =
                plate != null &&
                plate.confidence_score >= settings.thresholds.plate &&
                plate.predicted_value.trim() !== '';
              return (
                <div key={img.index} className={`frame-cell ${passes ? '' : 'excluded'}`}>
                  <img className="frame-img" src={img.imageDataUrl} alt={`Frame ${img.index}`} loading="lazy" />
                  <div className="frame-meta">
                    <div className="frow">
                      <span className="mono">
                        {t('results.frame')} #{img.index}
                      </span>
                      <span className="mono">{img.timestamp.toFixed(1)}s</span>
                    </div>
                    <div className="frow">
                      <span className="frame-pred mono" title={plate?.predicted_value ?? ''}>
                        {plate?.predicted_value || '—'}
                      </span>
                      {passes ? (
                        <Badge tone="match">{t('results.included')}</Badge>
                      ) : (
                        <Badge tone="review">
                          {plate != null && plate.confidence_score > 0
                            ? `${Math.round(plate.confidence_score * 100)}%`
                            : t('results.excluded')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {images.length === 0 && !loading && (
              <p className="section-sub" style={{ gridColumn: '1 / -1' }}>
                {error ? t('analysis.errorInvalidVideo') : t('results.noFrames')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
