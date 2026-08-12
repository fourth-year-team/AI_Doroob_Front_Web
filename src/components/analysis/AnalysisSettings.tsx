import type { AnalysisSettings, ModelType } from '../../types';
import { useI18n } from '../../i18n';
import { Icon } from '../common/Icon';

interface AnalysisSettingsProps {
  settings: AnalysisSettings;
  onChange: (patch: Partial<AnalysisSettings>) => void;
  onReset: () => void;
}

const MODEL_TYPE_KEYS: Record<ModelType, 'thresholdPlate' | 'thresholdModel' | 'thresholdColor'> = {
  plate: 'thresholdPlate',
  model: 'thresholdModel',
  color: 'thresholdColor',
};

export function AnalysisSettings({ settings, onChange, onReset }: AnalysisSettingsProps) {
  const { t } = useI18n();

  const setThreshold = (model: ModelType, value: number) => {
    onChange({ thresholds: { ...settings.thresholds, [model]: value } });
  };

  return (
    <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="settings" size={15} />
          <span style={{ color: 'var(--accent)' }}>{t('settings.title')}</span>
        </h3>
        <button className="btn btn--sm btn--ghost" onClick={onReset}>
          <Icon name="refresh" size={13} />
          Reset
        </button>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <div className="field" style={{ minWidth: 160, flex: 1 }}>
          <label>{t('settings.frameInterval')}</label>
          <div className="segmented">
            {[0.5, 1].map((v) => (
              <button
                key={v}
                className={settings.frameIntervalSeconds === v ? 'active' : ''}
                onClick={() => onChange({ frameIntervalSeconds: v })}
              >
                {v} {t('settings.sec')}
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ minWidth: 160, flex: 1 }}>
          <label>{t('settings.maxFrames')}</label>
          <div className="segmented">
            {[10, 15].map((v) => (
              <button
                key={v}
                className={settings.maxFrames === v ? 'active' : ''}
                onClick={() => onChange({ maxFrames: v })}
              >
                {v} {t('settings.frames')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label>{t('settings.aggregation')}</label>
        <div className="segmented">
          {(['majority', 'highest-confidence'] as const).map((m) => (
            <button
              key={m}
              className={settings.aggregationMethod === m ? 'active' : ''}
              onClick={() => onChange({ aggregationMethod: m })}
            >
              {m === 'majority' ? t('settings.aggregationMajority') : t('settings.aggregationHighest')}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>{t('settings.thresholds')}</label>
        <div className="kv-grid" style={{ gridTemplateColumns: '1fr' }}>
          {(Object.keys(settings.thresholds) as ModelType[]).map((model) => (
            <div
              key={model}
              className="kv-item"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span className="k">{t(`settings.${MODEL_TYPE_KEYS[model]}`)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={Math.round(settings.thresholds[model] * 100)}
                  onChange={(e) => setThreshold(model, Number(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, width: 44, textAlign: 'end' }}>
                  {Math.round(settings.thresholds[model] * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ fontSize: 12, color: 'var(--muted)', gap: 8 }}>
        <Icon name="info" size={14} />
        <span>{t('settings.hint')}</span>
      </div>
    </div>
  );
}
