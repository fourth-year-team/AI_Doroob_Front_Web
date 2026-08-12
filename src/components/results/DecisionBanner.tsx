import { useI18n, type I18nKey } from '../../i18n';
import type { DecisionLevel } from '../../types';
import { Icon, type IconName } from '../common/Icon';

interface DecisionBannerProps {
  level: DecisionLevel;
  reasonKey: string;
}

const STYLES: Record<DecisionLevel, { cls: string; icon: IconName }> = {
  clean: { cls: 'decision--clean', icon: 'check' },
  fraud: { cls: 'decision--fraud', icon: 'alert' },
  review: { cls: 'decision--review', icon: 'warning' },
};

export function DecisionBanner({ level, reasonKey }: DecisionBannerProps) {
  const { t } = useI18n();
  const style = STYLES[level];
  return (
    <div className={`decision-banner ${style.cls}`} role="status">
      <div className="d-icon">
        <Icon name={style.icon} size={22} />
      </div>
      <div>
        <h3>{t(`decision.${level}`)}</h3>
        <p>{t(reasonKey as I18nKey)}</p>
      </div>
    </div>
  );
}
