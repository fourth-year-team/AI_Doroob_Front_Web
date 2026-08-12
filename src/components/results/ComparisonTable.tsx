import type { ElementComparison } from '../../services/decisionEngine';
import { useI18n } from '../../i18n';
import { Badge, verdictBadgeTone } from '../common/Badge';
import { Icon } from '../common/Icon';

interface ComparisonTableProps {
  elements: ElementComparison[];
}

const ELEMENT_ICON: Record<ElementComparison['type'], 'camera' | 'video' | 'list'> = {
  plate: 'camera',
  model: 'video',
  color: 'list',
};

export function ComparisonTable({ elements }: ComparisonTableProps) {
  const { t } = useI18n();
  return (
    <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Icon name="eye-off" size={15} />
        <span style={{ color: 'var(--accent)' }}>{t('results.comparison')}</span>
      </h3>
      {elements.map((el) => (
        <div className="compare-row" key={el.type}>
          <div className="compare-side">
            <span className="cs-label">{t('results.declared')}</span>
            <span className="cs-value mono">{el.declared}</span>
          </div>
          <div className="compare-side">
            <span className="cs-label">{t('results.detected')}</span>
            <span className="cs-value mono">{el.detected || '—'}</span>
          </div>
          <div className="compare-verdict">
            <Icon name={ELEMENT_ICON[el.type]} size={15} />
            <strong style={{ textTransform: 'uppercase', fontSize: 11.5, letterSpacing: 0.04 }}>
              {el.type}
            </strong>
            <Badge tone={verdictBadgeTone(el.verdict)} icon={el.verdict === 'MATCH' ? 'check' : el.verdict === 'MISMATCH' ? 'alert' : 'warning'}>
              {t(`decision.${el.verdict.toLowerCase()}`)}
            </Badge>
            {el.verdict !== 'MATCH' && (
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {t('results.confidence')}: {Math.round(el.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
