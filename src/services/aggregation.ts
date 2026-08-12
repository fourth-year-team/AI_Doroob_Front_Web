/**
 * Frame aggregation service (FR-4.2, FR-4.4, FR-4.5, FR-4.8).
 * Applies per-model confidence filtering then aggregates per-frame model
 * predictions into a single final result via majority voting or
 * highest-confidence selection.
 */

import type { FrameResult, AggregationMethod } from '../types';

export interface AggregateInput {
  frames: FrameResult[];
  threshold: number;
  method: AggregationMethod;
}

export interface AggregateOutput {
  finalValue: string;
  confidence: number;
  method: string;
  votes: Record<string, number>;
  processedFrames: number;
  excludedFrames: number;
  hasResult: boolean;
}

export function normalizeValue(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, ' ').replace(/-+/g, ' ');
}

export function filterByConfidence(
  frames: FrameResult[],
  threshold: number,
): { included: FrameResult[]; excluded: FrameResult[] } {
  const included: FrameResult[] = [];
  const excluded: FrameResult[] = [];
  for (const frame of frames) {
    const passes = frame.confidence_score >= threshold && frame.predicted_value.trim() !== '';
    (passes ? included : excluded).push(frame);
  }
  return { included, excluded };
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function aggregateModel(input: AggregateInput): AggregateOutput {
  const { included, excluded } = filterByConfidence(input.frames, input.threshold);

  if (included.length === 0) {
    return {
      finalValue: '',
      confidence: 0,
      method: 'none',
      votes: {},
      processedFrames: included.length,
      excludedFrames: excluded.length,
      hasResult: false,
    };
  }

  if (input.method === 'highest-confidence') {
    const best = included.reduce((a, b) =>
      b.confidence_score > a.confidence_score ? b : a,
    );
    return {
      finalValue: best.predicted_value,
      confidence: best.confidence_score,
      method: 'highest-confidence',
      votes: { [best.predicted_value]: 1 },
      processedFrames: included.length,
      excludedFrames: excluded.length,
      hasResult: true,
    };
  }

  // Majority voting with tie-breaking by average confidence, then single-frame confidence.
  const byValue = new Map<string, FrameResult[]>();
  for (const frame of included) {
    const key = normalizeValue(frame.predicted_value);
    const list = byValue.get(key) ?? [];
    list.push(frame);
    byValue.set(key, list);
  }

  const entries = Array.from(byValue.entries());
  entries.sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    const avgB = mean(b[1].map((f) => f.confidence_score));
    const avgA = mean(a[1].map((f) => f.confidence_score));
    if (avgB !== avgA) return avgB - avgA;
    const maxB = Math.max(...b[1].map((f) => f.confidence_score));
    const maxA = Math.max(...a[1].map((f) => f.confidence_score));
    return maxB - maxA;
  });

  const [, winnerFrames] = entries[0];
  const votes: Record<string, number> = {};
  for (const [key, list] of entries) votes[key] = list.length;

  return {
    finalValue: winnerFrames[0].predicted_value,
    confidence: Number(mean(winnerFrames.map((f) => f.confidence_score)).toFixed(3)),
    method: 'majority',
    votes,
    processedFrames: included.length,
    excludedFrames: excluded.length,
    hasResult: true,
  };
}
