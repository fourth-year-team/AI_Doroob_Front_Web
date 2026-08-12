import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeProvider';
import { useData } from '../../state/DataContext';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Field } from '../common/Field';
import { AddVideoModal } from '../video/AddVideoModal';
import { CSV_COLUMNS } from '../../services/importExport';

export function Header() {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { filters, setFilters, importBookings, clearError } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const onSearch = (value: string) => {
    setFilters((f) => ({ ...f, query: value }));
    if (location.pathname !== '/') navigate('/');
  };

  const handleImport = () => {
    const result = importBookings(csvText);
    setImportMsg(t('addVideo.imported', { count: result.count }));
    clearError();
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand" aria-label={t('brand.name')}>
          <span className="brand-mark">
            <Icon name="shield" size={20} />
          </span>
          <span>
            <span className="brand-name">{t('brand.name')}</span>
            <br />
            <span className="brand-tag">{t('brand.tagline')}</span>
          </span>
        </NavLink>

        <nav className="topbar-nav" aria-label="Primary">
          <NavLink to="/" end>
            <Icon name="dashboard" size={15} />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/summary">
            <Icon name="report" size={15} />
            {t('nav.summary')}
          </NavLink>
        </nav>

        <div className="search-box topbar-search">
          <span className="search-icon">
            <Icon name="search" size={15} />
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('search.placeholder')}
            value={filters.query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="topbar-actions">
          <Button
            variant="soft"
            size="sm"
            icon="plus"
            className="btn--label"
            onClick={() => setShowAddVideo(true)}
          >
            {t('actions.addVideo')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="csv"
            className="btn--label"
            onClick={() => setShowImport(true)}
          >
            {t('actions.importCsv')}
          </Button>
          <button
            className="btn btn--icon"
            onClick={toggleLang}
            title={t('language.switch')}
            aria-label={t('language.switch')}
          >
            <Icon name="globe" size={17} />
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
              {lang === 'en' ? 'AR' : 'EN'}
            </span>
          </button>
          <button
            className="btn btn--icon"
            onClick={toggleTheme}
            title={t('theme.switch')}
            aria-label={t('theme.switch')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
          <span className="btn btn--icon" title={t('profile.operator')}>
            <Icon name="user" size={17} />
          </span>
        </div>
      </div>

      {showAddVideo && <AddVideoModal onClose={() => setShowAddVideo(false)} />}

      {showImport && (
        <Modal title={t('actions.importCsv')} onClose={() => setShowImport(false)}>
          <div className="stack">
            <p className="section-sub" style={{ lineHeight: 1.6 }}>
              {t('addVideo.exportHint')}
            </p>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
              {CSV_COLUMNS.join(', ')}
            </div>
            <Field label="CSV">
              <textarea
                className="input"
                rows={8}
                placeholder="video_id, video_path, plate_declared, model_declared, color_declared, scenario_type"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </Field>
            {importMsg && (
              <div className="info-banner" role="status">
                <Icon name="check" size={16} />
                {importMsg}
              </div>
            )}
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setShowImport(false)}>
                {t('actions.cancel')}
              </Button>
              <Button icon="csv" onClick={handleImport} disabled={!csvText.trim()}>
                {t('actions.importCsv')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}
