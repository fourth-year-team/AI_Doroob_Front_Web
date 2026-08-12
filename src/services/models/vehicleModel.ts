/**
 * Vehicle Model service.
 * Independent adapter unit (FR-4.6). Currently backed by the demo provider;
 * swap for a real model-classifier adapter later.
 */

import type { ModelProvider } from './types';
import { createDemoModelProvider } from './demoProvider';

export function createVehicleModel(groundTruthModel: string): ModelProvider {
  return createDemoModelProvider({
    modelType: 'model',
    groundTruthValue: groundTruthModel,
    label: 'Model Classifier (demo)',
  });
}
