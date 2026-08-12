import type { Booking } from '../../types';
import { useI18n } from '../../i18n';
import { Icon } from '../common/Icon';
import { Badge } from '../common/Badge';

interface BookingReferenceProps {
  booking: Booking;
}

export function BookingReference({ booking }: BookingReferenceProps) {
  const { t } = useI18n();
  const isFraud = booking.scenario_type === 'fraud';
  const isUnclear = booking.scenario_type === 'unclear';

  return (
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
        <div className="kv-item">
          <span className="k">{t('booking.scenarioType')}</span>
          <span className="v">
            <Badge tone={isUnclear ? 'review' : isFraud ? 'mismatch' : 'match'}>
              {isUnclear
                ? t('booking.scenarioUnclear')
                : isFraud
                  ? t('booking.scenarioFraud')
                  : t('booking.scenarioClean')}
            </Badge>
          </span>
        </div>
      </div>
    </div>
  );
}
