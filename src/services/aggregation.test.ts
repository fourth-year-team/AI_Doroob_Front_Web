import { describe, expect, it } from 'vitest';
import { aggregateModel, filterByConfidence, normalizeValue } from './aggregation';
import type { FrameResult } from '../types';

function frame(id: number, value: string, confidence: number, model: 'plate' | 'model' | 'color' = 'plate'): FrameResult {
  return {
    frame_id: id,
    session_id: 's1',
    model_type: model,
    predicted_value: value,
    confidence_score: confidence,
    included: confidence >= 0.7 && value.trim() !== '',
    timestamp: id,
  };
}

describe('normalizeValue', () => {
  it('uppercases, trims and collapses whitespace', () => {
    expect(normalizeValue('  klm-8832 ')).toBe('KLM 8832');
  });
});

describe('filterByConfidence', () => {
  it('excludes frames below threshold and empty predictions', () => {
    const frames = [
      frame(1, 'KLM-8832', 0.91),
      frame(2, 'KLM-8832', 0.5),
      frame(3, '', 0.99),
    ];
    const { included, excluded } = filterByConfidence(frames, 0.7);
    expect(included.map((f) => f.frame_id)).toEqual([1]);
    expect(excluded.map((f) => f.frame_id)).toEqual([2, 3]);
  });
});

describe('aggregateModel — majority voting', () => {
  it('picks the most frequent value', () => {
    const frames = [
      frame(1, 'KLM-8832', 0.9),
      frame(2, 'KLM-8832', 0.92),
      frame(3, 'KLM-8830', 0.95),
    ];
    const out = aggregateModel({ frames, threshold: 0.7, method: 'majority' });
    expect(out.finalValue).toBe('KLM-8832');
    expect(out.method).toBe('majority');
    expect(out.votes).toEqual({ 'KLM 8832': 2, 'KLM 8830': 1 });
    expect(out.processedFrames).toBe(3);
    expect(out.excludedFrames).toBe(0);
    expect(out.hasResult).toBe(true);
  });

  it('breaks ties by higher average confidence', () => {
    const frames = [
      frame(1, 'KLM-8832', 0.85),
      frame(2, 'KLM-8832', 0.86),
      frame(3, 'KLM-8830', 0.99),
      frame(4, 'KLM-8830', 0.99),
    ];
    const out = aggregateModel({ frames, threshold: 0.7, method: 'majority' });
    expect(out.finalValue).toBe('KLM-8830');
    expect(out.confidence).toBeCloseTo(0.99, 2);
  });

  it('returns no result when every frame is excluded', () => {
    const frames = [frame(1, 'KLM-8832', 0.4), frame(2, 'KLM-8832', 0.3)];
    const out = aggregateModel({ frames, threshold: 0.7, method: 'majority' });
    expect(out.hasResult).toBe(false);
    expect(out.finalValue).toBe('');
    expect(out.excludedFrames).toBe(2);
  });
});

describe('aggregateModel — highest confidence', () => {
  it('selects the single highest confidence frame', () => {
    const frames = [
      frame(1, 'KLM-8832', 0.8),
      frame(2, 'KLM-8830', 0.97),
      frame(3, 'KLM-8832', 0.75),
    ];
    const out = aggregateModel({ frames, threshold: 0.7, method: 'highest-confidence' });
    expect(out.finalValue).toBe('KLM-8830');
    expect(out.confidence).toBeCloseTo(0.97, 2);
  });
});
