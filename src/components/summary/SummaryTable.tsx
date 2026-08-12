import { useI18n } from '../../i18n';
import type { ElementVerdict, DecisionLevel, ScenarioType } from '../../types';
import { Badge, verdictBadgeTone } from '../common/Badge';
import { Icon } from '../common/Icon';

export interface SummaryRow {
  videoId: string;
  declaredPlate: string;
  detectedPlate: string;
  declaredModel: string;
  detectedModel: string;
  declaredColor: string;
  detectedColor: string;
  confidence: number;
  decision: DecisionLevel;
  scenario: ScenarioType;
  expected: ElementVerdict;
  actual: ElementVerdict;
  correct: boolean;
}

export function verdictLabel(t: (k: string) => string, v: ElementVerdict) {
  return t(`decision.${v.toLowerCase()}`);
}

interface SummaryTableProps {
  rows: SummaryRow[];
}

export function SummaryTable({ rows }: SummaryTableProps) {
  const { t } = useI18n();

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t('results.videoId')}</th>
            <th>{t('booking.declaredPlate')}</th>
            <th>{t('results.detected')} Plate</th>
            <th>{t('booking.declaredModel')}</th>
            <th>{t('results.detected')} Model</th>
            <th>{t('booking.declaredColor')}</th>
            <th>{t('results.detected')} Color</th>
            <th>{t('results.confidence')}</th>
            <th>{t('results.finalDecision')}</th>
            <th>{t('booking.scenarioType')}</th>
            <th>{t('summary.expectedResult')}</th>
            <th>{t('summary.actualResult')}</th>
            <th>✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.videoId}>
              <td className="mono" style={{ fontWeight: 700 }}>{r.videoId}</td>
              <td className="mono">{r.declaredPlate}</td>
              <td className="mono">{r.detectedPlate || '—'}</td>
              <td>{r.declaredModel}</td>
              <td>{r.detectedModel || '—'}</td>
              <td>{r.declaredColor}</td>
              <td>{r.detectedColor || '—'}</td>
              <td className="mono">{Math.round(r.confidence * 100)}%</td>
              <td>
                <Badge tone={verdictBadgeTone(r.decision)}>{t(`decision.${r.decision}`)}</Badge>
              </td>
              <td>
                <Badge tone={r.scenario === 'clean' ? 'match' : r.scenario === 'fraud' ? 'mismatch' : 'review'}>
                  {r.scenario === 'clean'
                    ? t('booking.scenarioClean')
                    : r.scenario === 'fraud'
                      ? t('booking.scenarioFraud')
                      : t('booking.scenarioUnclear')}
                </Badge>
              </td>
              <td>
                <Badge tone={verdictBadgeTone(r.expected)}>
                  {verdictLabel(t, r.expected)}
                </Badge>
              </td>
              <td>
                <Badge tone={verdictBadgeTone(r.actual)}>
                  {verdictLabel(t, r.actual)}
                </Badge>
              </td>
              <td>
                {r.correct ? (
                  <Icon name="check" size={16} style={{ color: 'var(--success)' }} />
                ) : (
                  <Icon name="close" size={16} style={{ color: 'var(--danger)' }} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
