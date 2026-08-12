import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { useData } from '../state/DataContext';
import { storage } from '../services/storage';
import { expectedForScenario, isDecisionCorrect, decisionToVerdict } from '../services/decisionEngine';
import { sessionsToCsv } from '../services/importExport';
import { SummaryStats } from '../components/summary/SummaryStats';
import { SummaryTable, type SummaryRow } from '../components/summary/SummaryTable';
import { Section } from '../components/common/Section';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';

export function SummaryPage() {
  const { t } = useI18n();
  const { sessions, bookings, running, runBatch } = useData();

  const rows = useMemo<SummaryRow[]>(() => {
    const completed = sessions.filter((s) => s.status === 'completed');
    return completed.map((s) => {
      const booking = bookings.find((b) => b.video_id === s.video_id);
      const agg = storage.getAggregated(s.session_id);
      const byModel = (m: 'plate' | 'model' | 'color') =>
        agg.find((a) => a.model_type === m);
      const scenario = booking?.scenario_type ?? 'clean';
      return {
        videoId: s.video_id,
        declaredPlate: booking?.plate_declared ?? s.video_id,
        detectedPlate: byModel('plate')?.final_predicted_value ?? '',
        declaredModel: booking?.model_declared ?? '',
        detectedModel: byModel('model')?.final_predicted_value ?? '',
        declaredColor: booking?.color_declared ?? '',
        detectedColor: byModel('color')?.final_predicted_value ?? '',
        confidence: Math.max(
          byModel('plate')?.confidence ?? 0,
          byModel('model')?.confidence ?? 0,
          byModel('color')?.confidence ?? 0,
        ),
        decision: s.final_decision,
        scenario,
        expected: expectedForScenario(scenario),
        actual: decisionToVerdict(s.final_decision),
        correct: isDecisionCorrect(scenario, s.final_decision),
      };
    });
  }, [sessions, bookings]);

  const completed = sessions.filter((s) => s.status === 'completed');
  const stats = useMemo(() => {
    const matches = completed.filter((s) => s.final_decision === 'clean').length;
    const mismatches = completed.filter((s) => s.final_decision === 'fraud').length;
    const reviews = completed.filter((s) => s.final_decision === 'review').length;
    const avgConf = completed.length
      ? completed.reduce((acc, s) => {
          const agg = storage.getAggregated(s.session_id);
          const confs = agg.map((a) => a.confidence);
          return acc + (confs.length ? Math.max(...confs) : 0);
        }, 0) / completed.length
      : null;
    const correct = rows.filter((r) => r.correct).length;
    const correctRate = rows.length ? correct / rows.length : null;
    return { matches, mismatches, reviews, avgConf, correctRate };
  }, [completed, rows]);

  const handleBatch = async () => {
    const targets = bookings.filter((b) =>
      !sessions.some((s) => s.video_id === b.video_id && s.status === 'completed'),
    );
    await runBatch(targets.length ? targets : bookings);
  };

  const exportCsv = () => {
    const records = completed
      .map((s) => ({ session: s, frames: storage.getFrames(s.session_id), aggregated: storage.getAggregated(s.session_id) }));
    const csv = sessionsToCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegisverify-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <div className="page-hero">
        <span className="eyebrow">
          <Icon name="report" size={13} />
          {t('nav.summary')}
        </span>
        <h1>{t('summary.title')}</h1>
        <p>{t('summary.desc')}</p>
      </div>

      <SummaryStats
        total={completed.length}
        matches={stats.matches}
        mismatches={stats.mismatches}
        reviews={stats.reviews}
        avgConfidence={stats.avgConf}
        correctRate={stats.correctRate}
      />

      <AnalysisProgress />

      <Section
        title={t('video.management')}
        subtitle={t('summary.tableHint')}
        actions={
          <div className="row">
            <Button
              variant="ghost"
              size="sm"
              icon="csv"
              onClick={exportCsv}
              disabled={!completed.length}
            >
              {t('actions.export')}
            </Button>
            <Button
              variant="soft"
              size="sm"
              icon="queue"
              loading={running != null}
              onClick={handleBatch}
              disabled={!bookings.length}
            >
              {t('actions.runBatch')}
            </Button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            icon="report"
            title={t('summary.noData')}
            description={t('summary.runBatchHint')}
          />
        ) : (
          <SummaryTable rows={rows} />
        )}
      </Section>
    </div>
  );
}
