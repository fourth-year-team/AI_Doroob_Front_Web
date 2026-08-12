/**
 * Model pipeline factory.
 * Builds the three model providers for a given booking and exposes them so the
 * analysis runner can process frames. Swap the demo-backed providers for real
 * backend adapters here without touching the rest of the pipeline.
 */

import type { ModelProvider } from './types';
import { createPlateModel } from './plateModel';
import { createVehicleModel } from './vehicleModel';
import { createColorModel } from './colorModel';
import type { Booking, ModelType } from '../../types';

export interface ModelPipeline {
  providers: Record<ModelType, ModelProvider>;
  isDemo: boolean;
}

export function createModelPipeline(booking: Booking): ModelPipeline {
  const gt = booking.demo;
  const providers: Record<ModelType, ModelProvider> = {
    plate: createPlateModel(gt?.actual_plate ?? ''),
    model: createVehicleModel(gt?.actual_model ?? ''),
    color: createColorModel(),
  };
  return { providers, isDemo: true };
}
