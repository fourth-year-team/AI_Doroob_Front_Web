/**
 * Analysis runner — orchestrates the full pipeline:
 * video source -> frame extraction -> model processing -> aggregation -> decision.
 * Stores FrameResults (per frame), AggregatedResults and the AnalysisSession.
 */

import { createRecordedVideoSource, createBlobUrlSource, type VideoSource } from './videoSource';
import { extractFrames } from './frameExtractor';
import { createModelPipeline } from './models';
import { aggregateModel } from './aggregation';
import { decide } from './decisionEngine';
import { storage } from './storage';
import type {
  AnalysisSettings,
  AnalysisSession,
  Booking,
  FrameResult,
  AggregatedResult,
  SessionRecord,
  AnalysisProgress,
  ModelType,
  DecisionLevel,
} from '../types';

const MODEL_TYPES: ModelType[] = ['plate', 'model', 'color'];

export interface RunAnalysisOptions {
  booking: Booking;
  settings: AnalysisSettings;
  onProgress?: (progress: AnalysisProgress) => void;
  /** When false, results are returned but not persisted to local storage. Defaults to true. */
  persist?: boolean;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSourceForBooking(booking: Booking): VideoSource {
  if (booking.video_path.startsWith('blob:')) {
    return createBlobUrlSource(booking.video_id, booking.video_path, booking.video_path);
  }
  return createRecordedVideoSource(booking.video_id, booking.video_path);
}

function setProgress(
  onProgress: RunAnalysisOptions['onProgress'],
  p: Partial<AnalysisProgress>,
) {
  onProgress?.({
    stage: 'processing',
    percent: 0,
    message: '',
    ...p,
  } as AnalysisProgress);
}

export async function runAnalysis(opts: RunAnalysisOptions): Promise<SessionRecord> {
  const { booking, settings, onProgress, persist = true } = opts;
  const sessionId = makeId();

  setProgress(onProgress, { stage: 'loading-video', percent: 4, message: 'loading' });
  const source = createSourceForBooking(booking);

  let frames;
  try {
    frames = await extractFrames(source, {
      intervalSeconds: settings.frameIntervalSeconds,
      maxFrames: settings.maxFrames,
      maxWidth: 960,
      onProgress: (done, total) =>
        setProgress(onProgress, {
          stage: 'extracting',
          percent: 4 + (done / total) * 26,
          message: 'extracting',
        }),
    });
  } finally {
    source.release();
  }

  if (!frames.frames || frames.frames.length === 0) {
    throw new Error('no-frames');
  }

  const pipeline = createModelPipeline(booking);
  const frameResults: FrameResult[] = [];
  const total = frames.frames.length;

  for (let fi = 0; fi < total; fi++) {
    const frame = frames.frames[fi];
    const percent = 30 + ((fi + 1) / total) * 65;
    setProgress(onProgress, {
      stage: 'processing',
      percent,
      message: 'processing',
      currentFrame: fi + 1,
    });

    for (const modelType of MODEL_TYPES) {
      const provider = pipeline.providers[modelType];
      let predictedValue = '';
      let confidence = 0;
      try {
        const prediction = await provider.predict(
          { index: frame.index, timestamp: frame.timestamp, imageData: frame.imageData },
          { seed: `${booking.video_id}:${sessionId}` },
        );
        predictedValue = prediction.status === 'ok' ? prediction.value : '';
        confidence = prediction.confidence;
      } catch {
        predictedValue = '';
        confidence = 0;
      }
      const threshold = settings.thresholds[modelType];
      frameResults.push({
        frame_id: frame.index,
        session_id: sessionId,
        model_type: modelType,
        predicted_value: predictedValue,
        confidence_score: confidence,
        included: confidence >= threshold && predictedValue.trim() !== '',
        timestamp: frame.timestamp,
      });
    }
  }

  const aggregatedResults: AggregatedResult[] = MODEL_TYPES.map((modelType) => {
    const threshold = settings.thresholds[modelType];
    const agg = aggregateModel({
      frames: frameResults.filter((f) => f.model_type === modelType),
      threshold,
      method: settings.aggregationMethod,
    });
    return {
      session_id: sessionId,
      model_type: modelType,
      final_predicted_value: agg.finalValue,
      confidence: agg.confidence,
      matched: 'UNCLEAR',
      method: agg.method,
      votes: agg.votes,
      processedFrames: agg.processedFrames,
      excludedFrames: agg.excludedFrames,
    };
  });

  const byModel = (m: ModelType) =>
    aggregatedResults.find((a) => a.model_type === m)!;

  const decision = decide(
    {
      plate: booking.plate_declared,
      model: booking.model_declared,
      color: booking.color_declared,
    },
    {
      plate: { value: byModel('plate').final_predicted_value, confidence: byModel('plate').confidence },
      model: { value: byModel('model').final_predicted_value, confidence: byModel('model').confidence },
      color: { value: byModel('color').final_predicted_value, confidence: byModel('color').confidence },
    },
    { thresholds: settings.thresholds },
  );

  for (const a of aggregatedResults) {
    a.matched = decision.elements.find((e) => e.type === a.model_type)!.verdict;
  }

  const representativeFrame = frames.frames[Math.min(2, frames.frames.length - 1)]?.imageDataUrl;

  const session: AnalysisSession = {
    session_id: sessionId,
    video_id: booking.video_id,
    video_path: booking.video_path,
    scenario_type: booking.scenario_type,
    timestamp: new Date().toISOString(),
    status: 'completed',
    final_decision: decision.level as DecisionLevel,
    settings,
    representativeFrame,
    frameCount: total,
    reason: decision.reasonKey,
    alert: decision.alertElements.length
      ? {
          elements: decision.alertElements,
          reason: decision.reasonKey,
        }
      : undefined,
  };

  if (persist) {
    storage.saveFrames(frameResults);
    storage.saveAggregated(aggregatedResults);
    storage.saveSession(session);
  }

  setProgress(onProgress, { stage: 'done', percent: 100, message: 'done' });

  return { session, frames: frameResults, aggregated: aggregatedResults };
}
