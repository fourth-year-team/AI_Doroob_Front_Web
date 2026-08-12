import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useData, errorI18nKey } from '../state/DataContext';
import { storage } from '../services/storage';
import { StatCard } from '../components/common/StatCard';
import { Section } from '../components/common/Section';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { VideoCard } from '../components/video/VideoCard';
import { BookingReference } from '../components/booking/BookingReference';
import { AnalysisSettings } from '../components/analysis/AnalysisSettings';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';

export function DashboardPage() {
  const { t } = useI18n();
  const data = useData();
  const navigate = useNavigate();

  const {
    bookings,
    sessions,
    selectedIds,
    toggleSelect,
    clearSelection,
    filters,
    setFilters,
    filteredBookings,
    settings,
    updateSettings,
    resetSettings,
    running,
    runSingle,
    runBatch,
    lastError,
    clearError,
  } = data;

  const completed = sessions.filter((s) => s.status === 'completed');
  const matches = completed.filter((s) => s.final_decision === 'clean').length;
  const mismatches = completed.filter((s) => s.final_decision === 'fraud').length;
  const reviews = completed.filter((s) => s.final_decision === 'review').length;
  const avgConf = useMemo(() => {
    if (!completed.length) return null;
    const confs = completed.flatMap((s) =>
      storage
        .getFrames(s.session_id)
        .map((f) => f.confidence_score),
    );
    return confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null;
  }, [completed]);

  const selectedBookings = bookings.filter((b) => selectedIds.includes(b.video_id));
  const singleSelected = selectedBookings.length === 1 ? selectedBookings[0] : null;

  const handleAnalyze = async (booking: (typeof bookings)[number]) => {
    try {
      const record = await runSingle(booking);
      navigate(`/results/${record.session.session_id}`);
    } catch {
      /* error shown via banner */
    }
  };

  const handleBatch = async () => {
    const targets =
      selectedBookings.length > 0
        ? selectedBookings
        : filteredBookings;
    if (!targets.length) return;
    await runBatch(targets);
    navigate('/summary');
  };

  return (
    <div className="stack">
      <div className="page-hero">
        <span className="eyebrow">
          <Icon name="shield" size={13} />
          AegisVerify
        </span>
        <h1>{t('home.heroTitle')}</h1>
        <p>{t('home.heroDesc')}</p>
      </div>

      <div className="demo-banner">
        <Icon name="info" size={16} />
        <span>{t('home.demoMode')}</span>
      </div>

      <div className="stats-row">
        <StatCard label={t('stats.processed')} value={completed.length} tone="accent" icon="video" />
        <StatCard label={t('stats.matches')} value={matches} tone="match" icon="check" />
        <StatCard label={t('stats.mismatches')} value={mismatches} tone="mismatch" icon="alert" />
        <StatCard label={t('stats.reviews')} value={reviews} tone="review" icon="warning" />
        <StatCard
          label={t('stats.avgConfidence')}
          value={avgConf != null ? `${Math.round(avgConf * 100)}%` : '—'}
          tone="info"
          icon="clock"
        />
      </div>

      {lastError && (
        <div className="error-banner" role="alert">
          <Icon name="alert" size={16} />
          <div style={{ flex: 1 }}>
            {t(errorI18nKey(lastError))}
            <button className="btn btn--sm btn--ghost" style={{ marginInlineStart: 12 }} onClick={clearError}>
              {t('actions.close')}
            </button>
          </div>
        </div>
      )}

      <AnalysisProgress />

      {singleSelected && (
        <div className="stack">
          <Section title={`${t('video.select')}: ${singleSelected.video_id}`} subtitle={t('booking.reference')}>
            <div className="stack">
              <BookingReference booking={singleSelected} />
              <AnalysisSettings settings={settings} onChange={updateSettings} onReset={resetSettings} />
              <Button
                size="lg"
                icon="play"
                loading={running?.videoId === singleSelected.video_id}
                onClick={() => handleAnalyze(singleSelected)}
                disabled={running != null}
              >
                {t('analysis.start')}
              </Button>
            </div>
          </Section>
        </div>
      )}

      <Section
        title={t('video.management')}
        subtitle={`${filteredBookings.length} ${t('video.duration')} · ${selectedIds.length} ${t('video.select')}`}
        actions={
          <div className="row">
            <Button
              variant="outline"
              size="sm"
              icon="queue"
              onClick={() => {
                if (filteredBookings.length) handleBatch();
              }}
              disabled={!filteredBookings.length || running != null}
            >
              {t('actions.runBatch')}
            </Button>
          </div>
        }
      >
        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon">
              <Icon name="search" size={15} />
            </span>
            <input
              className="input"
              type="search"
              placeholder={t('search.placeholder')}
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
          </div>
          <select
            className="select"
            style={{ width: 150 }}
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as typeof filters.status }))
            }
          >
            <option value="all">{t('video.allStatus')}</option>
            <option value="matched">{t('video.statusMatched')}</option>
            <option value="mismatch">{t('video.statusMismatch')}</option>
            <option value="review">{t('video.statusReview')}</option>
            <option value="ready">{t('video.statusReady')}</option>
          </select>
          <label className="row" style={{ gap: 7, fontSize: 12.5, cursor: 'pointer', marginInlineStart: 4 }}>
            <input
              type="checkbox"
              checked={filters.onlyMismatches}
              onChange={(e) =>
                setFilters((f) => ({ ...f, onlyMismatches: e.target.checked }))
              }
              style={{ accentColor: 'var(--accent)' }}
            />
            {t('video.onlyMismatches')}
          </label>
          <div style={{ flex: 1 }} />
          <Button variant="soft" size="sm" icon="filter" onClick={() => setFilters((f) => ({ ...f }))}>
            {t('actions.apply')}
          </Button>
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyState
            icon="search"
            title={filters.query || filters.status !== 'all' ? t('video.noResults') : t('video.noVideos')}
          />
        ) : (
          <div className="video-grid">
            {filteredBookings.map((b) => (
              <VideoCard
                key={b.video_id}
                data={b}
                selected={selectedIds.includes(b.video_id)}
                onToggle={() => toggleSelect(b.video_id)}
                onAnalyze={() => handleAnalyze(b)}
                onView={
                  b.lastDecision
                    ? () => {
                        const session = sessions.find(
                          (s) => s.video_id === b.video_id && s.status === 'completed',
                        );
                        if (session) navigate(`/results/${session.session_id}`);
                      }
                    : null
                }
              />
            ))}
          </div>
        )}
      </Section>

      {selectedBookings.length > 1 && (
        <div className="batch-bar">
          <span className="batch-label">
            <Icon name="check" size={16} />
            <strong>{selectedBookings.length}</strong>
            {t('video.select')}
          </span>
          <div className="row">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t('actions.cancel')}
            </Button>
            <Button
              size="sm"
              icon="queue"
              loading={running != null}
              onClick={async () => {
                await runBatch(selectedBookings);
                navigate('/summary');
              }}
            >
              {t('actions.runBatch')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
