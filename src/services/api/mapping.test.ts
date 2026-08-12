import { describe, expect, it } from 'vitest';
import type { AnalysisSettings, Booking, SessionRecord } from '../../types';
import {
  buildAnalysisRequest,
  mapResponseToSessionRecord,
  mapSessionRecordToResponse,
  requestToSettings,
} from './mapping';

const BOOKING: Booking = {
  video_id: 'vid-1',
  video_path: '/videos/vid-1.mp4',
  plate_declared: 'ABC-123',
  model_declared: 'Toyota Corolla',
  color_declared: 'White',
  scenario_type: 'fraud',
};

const SETTINGS: AnalysisSettings = {
  frameIntervalSeconds: 2,
  maxFrames: 10,
  thresholds: { plate: 0.7, model: 0.6, color: 0.8 },
  aggregationMethod: 'majority',
};

const RECORD: SessionRecord = {
  session: {
    session_id: 's1',
    video_id: 'vid-1',
    video_path: '/videos/vid-1.mp4',
    scenario_type: 'fraud',
    timestamp: '2026-01-01T00:00:00.000Z',
    status: 'completed',
    final_decision: 'fraud',
    settings: SETTINGS,
    representativeFrame: 'data:image/png;base64,aaa',
    frameCount: 2,
    reason: 'decision.reasonFraudPlate',
    alert: {
      elements: [
        { type: 'plate', declared: 'ABC-123', detected: 'XYZ-999', verdict: 'MISMATCH' },
      ],
      reason: 'decision.reasonFraudPlate',
    },
  },
  frames: [
    {
      frame_id: 1,
      session_id: 's1',
      model_type: 'plate',
      predicted_value: 'XYZ-999',
      confidence_score: 0.92,
      included: true,
      timestamp: 1,
    },
    {
      frame_id: 1,
      session_id: 's1',
      model_type: 'color',
      predicted_value: 'White',
      confidence_score: 0.85,
      included: true,
      timestamp: 1,
    },
    {
      frame_id: 2,
      session_id: 's1',
      model_type: 'plate',
      predicted_value: '',
      confidence_score: 0.4,
      included: false,
      timestamp: 2,
    },
  ],
  aggregated: [
    {
      session_id: 's1',
      model_type: 'plate',
      final_predicted_value: 'XYZ-999',
      confidence: 0.92,
      matched: 'MISMATCH',
      method: 'majority',
      votes: { 'XYZ-999': 1 },
      processedFrames: 1,
      excludedFrames: 1,
    },
  ],
};

describe('buildAnalysisRequest / requestToSettings', () => {
  it('maps booking + settings into a request', () => {
    const req = buildAnalysisRequest(BOOKING, SETTINGS);
    expect(req.video_id).toBe('vid-1');
    expect(req.video).toBe('/videos/vid-1.mp4');
    expect(req.frame_interval).toBe(2);
    expect(req.max_frames).toBe(10);
    expect(req.plate_threshold).toBe(0.7);
    expect(req.model_threshold).toBe(0.6);
    expect(req.color_threshold).toBe(0.8);
    expect(req.plate_declared).toBe('ABC-123');
    expect(req.aggregation_method).toBe('majority');
  });

  it('reconstructs settings from a request', () => {
    expect(requestToSettings(buildAnalysisRequest(BOOKING, SETTINGS))).toEqual(SETTINGS);
  });
});

describe('response round-trip', () => {
  it('preserves frames, aggregation and session data', () => {
    const response = mapSessionRecordToResponse(RECORD, BOOKING);
    expect(response.session_id).toBe('s1');
    expect(response.decision).toBe('fraud');
    expect(response.reason_key).toBe('decision.reasonFraudPlate');
    expect(response.representative_frame).toBe('data:image/png;base64,aaa');
    expect(response.frame_count).toBe(2);
    expect(response.frames).toHaveLength(2);
    expect(response.results).toHaveLength(1);
    expect(response.comparisons).toHaveLength(3);
    const plateComp = response.comparisons.find((c) => c.element === 'plate');
    expect(plateComp?.status).toBe('MISMATCH');

    const back = mapResponseToSessionRecord(response, buildAnalysisRequest(BOOKING, SETTINGS));
    expect(back.session.session_id).toBe('s1');
    expect(back.session.final_decision).toBe('fraud');
    expect(back.session.reason).toBe('decision.reasonFraudPlate');
    expect(back.session.settings).toEqual(SETTINGS);
    expect(back.frames).toHaveLength(3);
    expect(back.aggregated).toHaveLength(1);
    const frame = back.frames.find(
      (f) => f.frame_id === 2 && f.model_type === 'plate' && !f.included,
    );
    expect(frame?.confidence_score).toBe(0.4);
  });

  it('flags a failed response', () => {
    const record = mapResponseToSessionRecord(
      {
        session_id: 's2',
        video_id: 'vid-2',
        status: 'failed',
        frame_count: 0,
        frames: [],
        results: [],
        comparisons: [],
        decision: 'review',
        reason: 'analysis.failed',
        error: 'missing-booking',
      },
      buildAnalysisRequest(BOOKING, SETTINGS),
    );
    expect(record.session.status).toBe('failed');
    expect(record.session.error).toBe('missing-booking');
  });
});
