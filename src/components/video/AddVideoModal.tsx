import { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { useData } from '../../state/DataContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Field } from '../common/Field';
import type { Booking, ScenarioType } from '../../types';

interface AddVideoModalProps {
  onClose: () => void;
}

export function AddVideoModal({ onClose }: AddVideoModalProps) {
  const { t } = useI18n();
  const { addBooking } = useData();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState('');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [scenario, setScenario] = useState<ScenarioType>('clean');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!f.type.includes('mp4') && !f.name.toLowerCase().endsWith('.mp4')) {
      setError(t('analysis.errorUnsupported'));
      return;
    }
    setFile(f);
  };

  const save = () => {
    if (!file || !videoId.trim() || !plate.trim() || !model.trim() || !color.trim()) {
      setError(t('errors.generic'));
      return;
    }
    const url = URL.createObjectURL(file);
    const booking: Booking = {
      video_id: videoId.trim(),
      video_path: url,
      plate_declared: plate.trim(),
      model_declared: model.trim(),
      color_declared: color.trim(),
      scenario_type: scenario,
      description: description.trim() || undefined,
      demo: {
        actual_plate: plate.trim(),
        actual_model: model.trim(),
        actual_color: color.trim(),
      },
    };
    addBooking(booking);
    onClose();
  };

  return (
    <Modal title={t('addVideo.title')} onClose={onClose}>
      <div className="stack">
        <p className="section-sub">{t('addVideo.desc')}</p>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,.mp4"
          style={{ display: 'none' }}
          onChange={(e) => onFileChange(e.target.files?.[0])}
        />
        <Field label={t('addVideo.fileLabel')} hint={t('addVideo.fileHint')}>
          <Button variant="outline" icon="upload" onClick={() => fileRef.current?.click()}>
            {file ? file.name : t('actions.addVideo')}
          </Button>
        </Field>
        {error && <div className="error-banner">{error}</div>}
        <div className="row">
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('addVideo.videoIdLabel')} hint={t('addVideo.videoIdHint')}>
              <input
                className="input"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('booking.scenarioType')}>
              <select
                className="select"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as ScenarioType)}
              >
                <option value="clean">{t('booking.scenarioClean')}</option>
                <option value="fraud">{t('booking.scenarioFraud')}</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="row">
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('booking.declaredPlate')}>
              <input className="input" value={plate} onChange={(e) => setPlate(e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('booking.declaredModel')}>
              <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('booking.declaredColor')}>
              <input className="input" value={color} onChange={(e) => setColor(e.target.value)} />
            </Field>
          </div>
        </div>
        <Field label={t('addVideo.descriptionLabel')}>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button icon="check" onClick={save} disabled={!file}>
            {t('actions.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
