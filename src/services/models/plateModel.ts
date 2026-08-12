/**
 * Plate Model service.
 * Independent adapter unit (FR-4.6). Currently backed by the demo provider;
 * swap `createDemoModelProvider` for a real OCR adapter later.
 */

import type { ModelProvider } from './types';
import { createDemoModelProvider } from './demoProvider';

export function createPlateModel(groundTruthPlate: string): ModelProvider {
  return createDemoModelProvider({
    modelType: 'plate',
    groundTruthValue: groundTruthPlate,
    label: 'Plate OCR (demo)',
  });
}
