/**
 * API integration contract types.
 * Describe what the frontend sends (AnalysisRequest) and receives
 * (AnalysisResponse) from the analysis backend. No concrete transport is
 * assumed yet — the exact endpoint/contract is agreed with the backend team
 * later. The local demo adapter implements the same contract so the UI can be
 * built against it today and swapped for a real backend service afterwards.
 */

export type ApiModelType = 'plate' | 'model' | 'color';
export type ApiVerdict = 'MATCH' | 'MISMATCH' | 'UNCLEAR';
export type ApiDecision = 'clean' | 'fraud' | 'review';
export type ApiSessionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Known backend error codes that map to user-facing messages. */
export type ApiErrorCode =
  | 'no-frames'
  | 'unsupported'
  | 'invalid-video'
  | 'missing-booking'
  | 'model-failure'
  | 'empty-result';

/** Why a frame-level prediction was excluded from a model vote. */
export type ApiExcludeReason = 'below-confidence' | 'no-detection' | 'not-processed';

export interface AnalysisRequest {
  /** Unique id of the booking/video to analyze. */
  video_id: string;
  /** Video source: file path, blob url, or backend video id. */
  video?: string;
  /** Frame extraction interval in seconds. */
  frame_interval: number;
  /** Maximum number of frames to extract. */
  max_frames: number;
  /** Confidence thresholds per model, in [0, 1]. */
  plate_threshold: number;
  model_threshold: number;
  color_threshold: number;
  /** Booking reference (declared values) used by the backend for comparison. */
  plate_declared?: string;
  model_declared?: string;
  color_declared?: string;
  scenario_type?: 'clean' | 'fraud' | 'unclear';
  aggregation_method?: 'majority' | 'highest-confidence';
}

/** Per-model prediction for a single frame. */
export interface AnalysisFrameModelResult {
  value: string;
  confidence: number;
  /** Whether the frame participated in the model vote. */
  included: boolean;
  /** Why the frame was excluded (present when included is false). */
  excluded_reason?: ApiExcludeReason;
}

/** Frame-level results for one extracted frame. */
export interface AnalysisFrameResult {
  frame_id: number;
  timestamp: number;
  plate?: AnalysisFrameModelResult;
  model?: AnalysisFrameModelResult;
  color?: AnalysisFrameModelResult;
}

/** Aggregated result for one model over all processed frames. */
export interface AnalysisModelResult {
  model_type: ApiModelType;
  final_value: string;
  confidence: number;
  matched: ApiVerdict;
  method: string;
  votes: Record<string, number>;
  processed_frames: number;
  excluded_frames: number;
}

/** Declared vs detected comparison for one element. */
export interface AnalysisComparisonResult {
  element: ApiModelType;
  declared: string;
  detected: string;
  confidence: number;
  status: ApiVerdict;
}

export interface AnalysisResponse {
  session_id: string;
  video_id: string;
  status: ApiSessionStatus;
  /** Representative frame as a data URL or remote URL. */
  representative_frame?: string;
  frame_count: number;
  frames: AnalysisFrameResult[];
  results: AnalysisModelResult[];
  comparisons: AnalysisComparisonResult[];
  decision: ApiDecision;
  reason: string;
  /** i18n key of the decision reason, when the backend exposes one. */
  reason_key?: string;
  error?: ApiErrorCode;
}
