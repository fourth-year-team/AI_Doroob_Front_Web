import type { ModelType, ModelPrediction } from '../../types';

export interface ModelFrameInput {
  index: number;
  timestamp: number;
  imageData: ImageData;
}

export interface ModelProviderContext {
  seed: string;
}

export interface ModelProvider {
  readonly id: string;
  readonly name: string;
  readonly modelType: ModelType;
  /** 'demo' = simulated provider. Real providers come from the backend. */
  readonly kind: 'demo' | 'real';
  predict(frame: ModelFrameInput, ctx?: ModelProviderContext): Promise<ModelPrediction>;
}

export interface PixelStats {
  dominantColor: string;
  confidence: number;
  averageBrightness: number;
  averageSaturation: number;
  dominantHue: number;
  colorfulness: number;
}
