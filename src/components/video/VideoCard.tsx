import type { Booking, VideoStatus } from '../../types';
import { useI18n } from '../../i18n';
import { VideoThumbnail } from './VideoThumbnail';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export interface VideoCardData extends Booking {
  status: VideoStatus;
  lastDecision: string | null;
}

interface VideoCardProps {
  data: VideoCardData;
  selected: boolean;
  onToggle: () => void;
  onAnalyze: () => void;
  onView: (() => void) | null;
}

export function statusBadgeTone(status: VideoStatus) {
  switch (status) {
    case 'matched':
      return 'match' as const;
    case 'mismatch':
      return 'mismatch' as const;
    case 'review':
      return 'review' as const;
    case 'processing':
      return 'info' as const;
    default:
      return 'info' as const;
  }
}

export function statusCardClass(status: VideoStatus) {
  switch (status) {
    case 'matched':
      return 'video-card--matched';
    case 'mismatch':
      return 'video-card--mismatch';
    case 'review':
      return 'video-card--review';
    case 'processing':
      return 'video-card--processing';
    default:
      return 'video-card--ready';
  }
}

export function statusLabelKey(status: VideoStatus) {
  switch (status) {
    case 'matched':
      return 'video.statusMatched' as const;
    case 'mismatch':
      return 'video.statusMismatch' as const;
    case 'review':
      return 'video.statusReview' as const;
    case 'processing':
      return 'video.statusProcessing' as const;
    default:
      return 'video.statusReady' as const;
  }
}

export function VideoCard({ data, selected, onToggle, onAnalyze, onView }: VideoCardProps) {
  const { t } = useI18n();
  const scenarioFraud = data.scenario_type === 'fraud';

  return (
    <article className={`video-card ${statusCardClass(data.status)} ${selected ? 'selected' : ''}`}>
      <div className="video-card-top">
        <label className="video-card-check" aria-label={t('video.select')}>
          <input type="checkbox" checked={selected} onChange={onToggle} />
        </label>
        <div className="video-card-status">
          <Badge tone={statusBadgeTone(data.status)}>{t(statusLabelKey(data.status))}</Badge>
        </div>
        <VideoThumbnail videoPath={data.video_path} label={data.video_id} />
      </div>

      <div className="video-card-body">
        <div className="video-card-title">
          <strong className="mono">{data.video_id}</strong>
          {data.duration && <span className="duration">{data.duration}</span>}
        </div>
        <p className="video-card-desc">
          {data.description || `${t('booking.scenarioType')}: ${scenarioFraud ? t('booking.scenarioFraud') : t('booking.scenarioClean')}`}
        </p>

        <div className="vehicle-row">
          <span className="k">{t('booking.declaredPlate')}</span>
          <span className="v mono">{data.plate_declared}</span>
        </div>
        <div className="vehicle-row">
          <span className="k">{t('booking.declaredModel')}</span>
          <span className="v">{data.model_declared}</span>
        </div>
        <div className="vehicle-row">
          <span className="k">{t('booking.declaredColor')}</span>
          <span className="v">{data.color_declared}</span>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Badge tone={scenarioFraud ? 'review' : 'match'} icon={scenarioFraud ? 'alert' : 'check'}>
            {scenarioFraud ? t('booking.scenarioFraud') : t('booking.scenarioClean')}
          </Badge>
          {data.lastDecision && (
            <Badge tone={statusBadgeTone(data.status)}>{data.lastDecision}</Badge>
          )}
        </div>

        <div className="video-card-actions">
          {onView && (
            <Button variant="ghost" size="sm" icon="eye" onClick={onView}>
              {t('actions.view')}
            </Button>
          )}
          <Button variant="soft" size="sm" icon="play" onClick={onAnalyze}>
            {t('actions.analyze')}
          </Button>
        </div>
      </div>
    </article>
  );
}
