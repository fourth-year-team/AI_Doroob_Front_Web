import type { AnalysisSettings } from '../types';
import { storage } from './storage';

export const DEFAULT_SETTINGS: AnalysisSettings = {
  frameIntervalSeconds: 1,
  maxFrames: 15,
  thresholds: {
    plate: 0.7,
    model: 0.7,
    color: 0.7,
  },
  aggregationMethod: 'majority',
};

export function loadSettings(): AnalysisSettings {
  const saved = storage.getSettings();
  if (!saved) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    thresholds: { ...DEFAULT_SETTINGS.thresholds, ...(saved.thresholds ?? {}) },
  };
}
