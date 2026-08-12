import type { ElementComparison } from '../../services/decisionEngine';
import { useI18n } from '../../i18n';
import { Icon } from '../common/Icon';
import { Badge, verdictBadgeTone } from '../common/Badge';

interface AlertDetailsProps {
  elements: ElementComparison[];
}

export function AlertDetails({ elements }: AlertDetailsProps) {
  const { t } = useI18n();
  if (elements.length === 0) return null;
  return (
    <div className="card card--pad alert-details">
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--danger)',
        }}
      >
        <Icon name="alert" size={16} />
        {t('alert.title')}
      </h3>
      {elements.map((el) => (
        <div className="alert-item" key={el.type}>
          <span className="a-type">{t(`decision.${el.verdict.toLowerCase()}`)}</span>
          <div className="a-diff">
            <span>
              {t('results.declared')}: <strong>{el.declared}</strong>
            </span>
            <span className="a-arrow">
              <Icon name="arrow" size={13} />
            </span>
            <span>
              {t('results.detected')}: <strong>{el.detected || '—'}</strong>
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <Badge tone={verdictBadgeTone(el.verdict)}>{el.type}</Badge>
        </div>
      ))}
    </div>
  );
}
