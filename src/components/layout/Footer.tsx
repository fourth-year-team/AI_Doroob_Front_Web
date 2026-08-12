import { useI18n } from '../../i18n';
import { Icon } from '../common/Icon';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="app-footer">
      <span className="f-brand">
        <Icon name="shield" size={15} />
        {t('brand.name')}
      </span>
      <span>{t('footer.rights')}</span>
      <span>
        {t('footer.modelsLabel')} <BadgeDemo />
      </span>
    </footer>
  );
}

function BadgeDemo() {
  const { t } = useI18n();
  return (
    <span className="badge badge--info">{t('footer.demoProvider')}</span>
  );
}
