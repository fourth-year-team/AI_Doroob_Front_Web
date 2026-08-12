/**
 * Mappers between the API contract types (AnalysisRequest/AnalysisResponse)
 * and the app's internal types (AnalysisSettings, SessionRecord).
 */

import { decide } from '../decisionEngine';
import { DEFAULT_SETTINGS } from '../settings';
import type {
  AnalysisSession,
  AnalysisSettings,
  AggregatedResult,
  Booking,
  FrameResult,
  ModelType,
  SessionRecord,
} from '../../types';
import type {
  AnalysisFrameResult,
  AnalysisModelResult,
  AnalysisRequest,
  AnalysisResponse,
} from './types';

const MODEL_TYPES: ModelType[] = ['plate', 'model', 'color'];

export function buildAnalysisRequest(
  booking: Booking,
  settings: AnalysisSettings,
): AnalysisRequest {
  return {
    video_id: booking.video_id,
    video: booking.video_path,
    frame_interval: settings.frameIntervalSeconds,
    max_frames: settings.maxFrames,
    plate_threshold: settings.thresholds.plate,
    model_threshold: settings.thresholds.model,
    color_threshold: settings.thresholds.color,
    plate_declared: booking.plate_declared,
    model_declared: booking.model_declared,
    color_declared: booking.color_declared,
    scenario_type: booking.scenario_type,
    aggregation_method: settings.aggregationMethod,
  };
}

export function requestToSettings(request: AnalysisRequest): AnalysisSettings {
  return {
    frameIntervalSeconds: request.frame_interval,
    maxFrames: request.max_frames,
    thresholds: {
      plate: request.plate_threshold,
      model: request.model_threshold,
      color: request.color_threshold,
    },
    aggregationMethod: request.aggregation_method ?? 'majority',
  };
}

function detectedFor(
  aggregated: AggregatedResult[],
  modelType: ModelType,
): { value: string; confidence: number } {
  const agg = aggregated.find((a) => a.model_type === modelType);
  return { value: agg?.final_predicted_value ?? '', confidence: agg?.confidence ?? 0 };
}

export function mapSessionRecordToResponse(
  record: SessionRecord,
  booking?: Booking,
): AnalysisResponse {
  const { session, frames, aggregated } = record;

  const byFrame = new Map<number, AnalysisFrameResult>();
  for (const f of frames) {
    let entry = byFrame.get(f.frame_id);
    if (!entry) {
      entry = { frame_id: f.frame_id, timestamp: f.timestamp };
      byFrame.set(f.frame_id, entry);
    }
    entry[f.model_type] = {
      value: f.predicted_value,
      confidence: f.confidence_score,
      included: f.included,
      excluded_reason: f.included
        ? undefined
        : f.predicted_value.trim() === ''
          ? 'no-detection'
          : 'below-confidence',
    };
  }

  const results: AnalysisModelResult[] = aggregated.map((a) => ({
    model_type: a.model_type,
    final_value: a.final_predicted_value,
    confidence: a.confidence,
    matched: a.matched,
    method: a.method,
    votes: a.votes,
    processed_frames: a.processedFrames,
    excluded_frames: a.excludedFrames,
  }));

  const comparisons = booking
    ? decide(
        {
          plate: booking.plate_declared,
          model: booking.model_declared,
          color: booking.color_declared,
        },
        {
          plate: detectedFor(aggregated, 'plate'),
          model: detectedFor(aggregated, 'model'),
          color: detectedFor(aggregated, 'color'),
        },
        { thresholds: session.settings.thresholds },
      ).elements.map((e) => ({
        element: e.type,
        declared: e.declared,
        detected: e.detected,
        confidence: e.confidence,
        status: e.verdict,
      }))
    : [];

  return {
    session_id: session.session_id,
    video_id: session.video_id,
    status: session.status,
    representative_frame: session.representativeFrame,
    frame_count: session.frameCount,
    frames: Array.from(byFrame.values()),
    results,
    comparisons,
    decision: session.final_decision,
    reason: session.reason,
    reason_key: session.reason,
    error: session.error as AnalysisResponse['error'],
  };
}

export function mapResponseToSessionRecord(
  response: AnalysisResponse,
  request?: AnalysisRequest,
): SessionRecord {
  const settings = request ? requestToSettings(request) : DEFAULT_SETTINGS;

  const session: AnalysisSession = {
    session_id: response.session_id,
    video_id: response.video_id,
    video_path: request?.video ?? '',
    scenario_type: request?.scenario_type ?? 'unclear',
    timestamp: new Date().toISOString(),
    status:
      response.status === 'completed'
        ? 'completed'
        : response.status === 'failed'
          ? 'failed'
          : 'processing',
    final_decision: response.decision,
    settings,
    representativeFrame: response.representative_frame,
    frameCount: response.frame_count,
    reason: response.reason_key ?? response.reason,
    alert: response.comparisons.some((c) => c.status !== 'MATCH')
      ? {
          elements: response.comparisons
            .filter((c) => c.status !== 'MATCH')
            .map((c) => ({
              type: c.element,
              declared: c.declared,
              detected: c.detected,
              verdict: c.status,
            })),
          reason: response.reason_key ?? response.reason,
        }
      : undefined,
    error: response.error,
  };

  const frames: FrameResult[] = [];
  for (const frame of response.frames) {
    for (const modelType of MODEL_TYPES) {
      const r = frame[modelType];
      if (!r) continue;
      frames.push({
        frame_id: frame.frame_id,
        session_id: response.session_id,
        model_type: modelType,
        predicted_value: r.value,
        confidence_score: r.confidence,
        included: r.included,
        timestamp: frame.timestamp,
      });
    }
  }

  const aggregated: AggregatedResult[] = response.results.map((r) => ({
    session_id: response.session_id,
    model_type: r.model_type,
    final_predicted_value: r.final_value,
    confidence: r.confidence,
    matched: r.matched,
    method: r.method,
    votes: r.votes,
    processedFrames: r.processed_frames,
    excludedFrames: r.excluded_frames,
  }));

  return { session, frames, aggregated };
}
