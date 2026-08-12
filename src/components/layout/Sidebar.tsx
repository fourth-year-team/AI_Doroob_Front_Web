import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useData } from '../../state/DataContext';
import { storage } from '../../services/storage';
import { Icon } from '../common/Icon';
import { Badge, verdictBadgeTone } from '../common/Badge';

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

export function Sidebar() {
  const { t } = useI18n();
  const { sessions, bookings } = useData();
  const navigate = useNavigate();

  const completed = sessions.filter((s) => s.status === 'completed');
  const matches = completed.filter((s) => s.final_decision === 'clean').length;
  const mismatches = completed.filter((s) => s.final_decision === 'fraud').length;
  const reviews = completed.filter((s) => s.final_decision === 'review').length;

  let avgConf: number | null = null;
  if (completed.length) {
    const totals = completed.map((s) => {
      const agg = storage.getAggregated(s.session_id);
      const confs = agg.map((a) => a.confidence);
      return confs.length ? Math.max(...confs) : 0;
    });
    avgConf = totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  const recent = completed.slice(0, 4);

  return (
    <aside className="sidebar">
      <div className="side-panel">
        <h3>
          <Icon name="dashboard" size={15} />
          {t('sidebar.quickStats')}
        </h3>
        <div className="kv-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="kv-item">
            <span className="k">{t('stats.processed')}</span>
            <span className="v" style={{ color: 'var(--text)' }}>{completed.length}</span>
          </div>
          <div className="kv-item">
            <span className="k">{t('stats.matches')}</span>
            <span className="v" style={{ color: 'var(--success)' }}>{matches}</span>
          </div>
          <div className="kv-item">
            <span className="k">{t('stats.mismatches')}</span>
            <span className="v" style={{ color: 'var(--danger)' }}>{mismatches}</span>
          </div>
          <div className="kv-item">
            <span className="k">{t('stats.reviews')}</span>
            <span className="v" style={{ color: 'var(--warning)' }}>{reviews}</span>
          </div>
        </div>
        <div className="kv-item">
          <span className="k">{t('stats.avgConfidence')}</span>
          <span className="v" style={{ color: 'var(--info)' }}>
            {avgConf != null ? pct(avgConf) : '—'}
          </span>
        </div>
      </div>

      <div className="side-panel">
        <h3>
          <Icon name="clock" size={15} />
          {t('sidebar.recentResults')}
        </h3>
        {recent.length === 0 && (
          <p className="section-sub">{t('analysis.noSessions')}</p>
        )}
        {recent.map((s) => (
          <div
            key={s.session_id}
            className="recent-item"
            onClick={() => navigate(`/results/${s.session_id}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/results/${s.session_id}`);
            }}
          >
            <div className="recent-item-top">
              <strong className="mono">{s.video_id}</strong>
              <Badge tone={verdictBadgeTone(s.final_decision)}>{s.final_decision}</Badge>
            </div>
            <div className="kv">
              <span>{t('booking.declaredPlate')}: {s.alert?.elements[0]?.declared ?? ''}</span>
              <span>{s.frameCount} {t('settings.frames')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="side-panel">
        <h3>
          <Icon name="list" size={15} />
          {t('sidebar.legend')}
        </h3>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--success)' }} />
          {t('sidebar.legendMatch')}
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--danger)' }} />
          {t('sidebar.legendMismatch')}
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--warning)' }} />
          {t('sidebar.legendReview')}
        </div>
      </div>

      <div className="side-panel">
        <h3>
          <Icon name="help" size={15} />
          {t('sidebar.support')}
        </h3>
        <p className="section-sub">{t('sidebar.supportText')}</p>
        <p className="section-sub">
          {bookings.length} {t('video.management')} · {t('nav.dashboard')}
        </p>
      </div>
    </aside>
  );
}
