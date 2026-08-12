import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n, type I18nKey } from '../i18n';
import { useData } from '../state/DataContext';
import { decide } from '../services/decisionEngine';
import { DecisionBanner } from '../components/results/DecisionBanner';
import { FrameStrip } from '../components/results/FrameStrip';
import { ModelResultCard } from '../components/results/ModelResultCard';
import { ComparisonTable } from '../components/results/ComparisonTable';
import { AlertDetails } from '../components/results/AlertDetails';
import { EmptyState } from '../components/common/EmptyState';
import { Icon } from '../components/common/Icon';
import type { ModelType } from '../types';

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, dir } = useI18n();
  const { getSessionRecord, bookings, settings } = useData();

  const record = sessionId ? getSessionRecord(sessionId) : null;

  const comparison = useMemo(() => {
    if (!record) return null;
    const booking = bookings.find((b) => b.video_id === record.session.video_id);
    const agg = (m: ModelType) => record.aggregated.find((a) => a.model_type === m);
    return decide(
      {
        plate: booking?.plate_declared ?? '',
        model: booking?.model_declared ?? '',
        color: booking?.color_declared ?? '',
      },
      {
        plate: { value: agg('plate')?.final_predicted_value ?? '', confidence: agg('plate')?.confidence ?? 0 },
        model: { value: agg('model')?.final_predicted_value ?? '', confidence: agg('model')?.confidence ?? 0 },
        color: { value: agg('color')?.final_predicted_value ?? '', confidence: agg('color')?.confidence ?? 0 },
      },
      { thresholds: settings.thresholds },
    );
  }, [record, bookings, settings.thresholds]);

  if (!record) {
    return (
      <div className="stack">
        <EmptyState
          icon="warning"
          title={t('results.sessionNotFound')}
          action={
            <Link className="btn btn--soft btn--sm" to="/">
              <Icon name="arrow" size={14} />
              {t('nav.dashboard')}
            </Link>
          }
        />
      </div>
    );
  }

  const { session, frames, aggregated } = record;
  const booking = bookings.find((b) => b.video_id === session.video_id);
  const agg = (m: ModelType) => aggregated.find((a) => a.model_type === m)!;
  const framesFor = (m: ModelType) => frames.filter((f) => f.model_type === m);

  return (
    <div className="stack">
      <div className="page-hero">
        <Link
          to="/"
          className="row"
          style={{ gap: 6, fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}
        >
          <Icon name="arrow" size={13} style={dir === 'rtl' ? {} : { transform: 'scaleX(-1)' }} />
          {t('nav.dashboard')}
        </Link>
        <span className="eyebrow">
          <Icon name="video" size={13} />
          {session.video_id}
        </span>
        <h1>{t('results.title')}</h1>
      </div>

      <DecisionBanner level={session.final_decision} reasonKey={session.reason} />

      {comparison && <AlertDetails elements={comparison.alertElements} />}

      <div className="kv-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="kv-item">
          <span className="k">{t('results.videoId')}</span>
          <span className="v mono">{session.video_id}</span>
        </div>
        <div className="kv-item">
          <span className="k">{t('results.videoName')}</span>
          <span className="v mono" style={{ fontSize: 12 }}>{session.video_path}</span>
        </div>
        <div className="kv-item">
          <span className="k">{t('booking.scenarioType')}</span>
          <span className="v">{booking ? t(`booking.scenario${booking.scenario_type === 'clean' ? 'Clean' : booking.scenario_type === 'fraud' ? 'Fraud' : 'Unclear'}`) : '—'}</span>
        </div>
        <div className="kv-item">
          <span className="k">{t('settings.frameInterval')}</span>
          <span className="v">{session.settings.frameIntervalSeconds}s</span>
        </div>
        <div className="kv-item">
          <span className="k">{t('settings.maxFrames')}</span>
          <span className="v">{session.settings.maxFrames}</span>
        </div>
        <div className="kv-item">
          <span className="k">{t('results.processedFrames')}</span>
          <span className="v">{session.frameCount}</span>
        </div>
      </div>

      <FrameStrip session={session} frames={frames} />

      {booking && (
        <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="list" size={15} />
            <span style={{ color: 'var(--accent)' }}>{t('booking.reference')}</span>
          </h3>
          <div className="kv-grid">
            <div className="kv-item">
              <span className="k">{t('booking.declaredPlate')}</span>
              <span className="v mono">{booking.plate_declared}</span>
            </div>
            <div className="kv-item">
              <span className="k">{t('booking.declaredModel')}</span>
              <span className="v">{booking.model_declared}</span>
            </div>
            <div className="kv-item">
              <span className="k">{t('booking.declaredColor')}</span>
              <span className="v">{booking.color_declared}</span>
            </div>
          </div>
        </div>
      )}

      <div className="stack">
        <div className="section-head">
          <h2 className="section-title">{t('results.modelResults')}</h2>
        </div>
        <ModelResultCard
          modelType="plate"
          title={t('results.plateModel')}
          icon="camera"
          agg={agg('plate')}
          frames={framesFor('plate')}
          threshold={settings.thresholds.plate}
        />
        <ModelResultCard
          modelType="model"
          title={t('results.vehicleModel')}
          icon="video"
          agg={agg('model')}
          frames={framesFor('model')}
          threshold={settings.thresholds.model}
        />
        <ModelResultCard
          modelType="color"
          title={t('results.colorModel')}
          icon="list"
          agg={agg('color')}
          frames={framesFor('color')}
          threshold={settings.thresholds.color}
        />
      </div>

      {comparison && <ComparisonTable elements={comparison.elements} />}

      <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="info" size={15} />
          <span style={{ color: 'var(--accent)' }}>{t('results.decisionReason')}</span>
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(session.reason as I18nKey)}</p>
      </div>
    </div>
  );
}
