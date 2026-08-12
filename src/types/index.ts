export type ScenarioType = 'clean' | 'fraud' | 'unclear';
export type ModelType = 'plate' | 'model' | 'color';
export type ElementVerdict = 'MATCH' | 'MISMATCH' | 'UNCLEAR';
export type DecisionLevel = 'clean' | 'fraud' | 'review';
export type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type VideoStatus = 'pending' | 'ready' | 'matched' | 'mismatch' | 'review' | 'processing';

export interface DemoGroundTruth {
  actual_plate: string;
  actual_model: string;
  actual_color: string;
}

export interface Booking {
  video_id: string;
  video_path: string;
  plate_declared: string;
  model_declared: string;
  color_declared: string;
  scenario_type: ScenarioType;
  description?: string;
  duration?: string;
  demo?: DemoGroundTruth;
}

export type AggregationMethod = 'majority' | 'highest-confidence';

export interface AnalysisSettings {
  frameIntervalSeconds: number;
  maxFrames: number;
  thresholds: Record<ModelType, number>;
  aggregationMethod: AggregationMethod;
}

export interface FrameResult {
  frame_id: number;
  session_id: string;
  model_type: ModelType;
  predicted_value: string;
  confidence_score: number;
  included: boolean;
  timestamp: number;
}

export interface AggregatedResult {
  session_id: string;
  model_type: ModelType;
  final_predicted_value: string;
  confidence: number;
  matched: ElementVerdict;
  method: string;
  votes: Record<string, number>;
  processedFrames: number;
  excludedFrames: number;
}

export interface AlertElement {
  type: ModelType;
  declared: string;
  detected: string;
  verdict: ElementVerdict;
}

export interface DecisionAlert {
  elements: AlertElement[];
  reason: string;
}

export interface AnalysisSession {
  session_id: string;
  video_id: string;
  video_path: string;
  scenario_type: ScenarioType;
  timestamp: string;
  status: SessionStatus;
  final_decision: DecisionLevel;
  settings: AnalysisSettings;
  representativeFrame?: string;
  frameCount: number;
  reason: string;
  alert?: DecisionAlert;
  error?: string;
}

export interface SessionRecord {
  session: AnalysisSession;
  frames: FrameResult[];
  aggregated: AggregatedResult[];
  booking?: Booking;
}

export interface FrameExtracted {
  index: number;
  timestamp: number;
  imageDataUrl: string;
  imageData: ImageData;
}

export interface FrameExtractionResult {
  frames: FrameExtracted[];
  width: number;
  height: number;
}

export interface ModelPrediction {
  value: string;
  confidence: number;
  status: 'ok' | 'failed';
  error?: string;
}

export interface AnalysisProgress {
  stage: 'idle' | 'loading-video' | 'extracting' | 'processing' | 'done' | 'failed';
  percent: number;
  message: string;
  currentFrame?: number;
}
