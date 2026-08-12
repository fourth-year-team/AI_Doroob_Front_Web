/**
 * DemoModelProvider — SIMULATED inference provider.
 *
 * Explicitly NOT a real AI model. It returns per-frame predictions seeded
 * from each video's demo ground truth (defined in mock-bookings.json) with
 * deterministic confidence jitter, so the demo behaves reliably while the
 * real backend models are being connected.
 *
 * Replace these providers with real model adapters (kind: 'real') without
 * touching the rest of the pipeline — see services/models/index.ts.
 */

import type {
  ModelProvider,
  ModelFrameInput,
  ModelProviderContext,
} from './types';
import type { ModelType } from '../../types';

export interface DemoProfile {
  baseConfidence: number;
  jitter: number;
  lowChance: number;
  lowRange: [number, number];
  failChance: number;
}

const PROFILES: Record<ModelType, DemoProfile> = {
  plate: { baseConfidence: 0.93, jitter: 0.045, lowChance: 0.16, lowRange: [0.44, 0.62], failChance: 0.03 },
  model: { baseConfidence: 0.9, jitter: 0.05, lowChance: 0.12, lowRange: [0.48, 0.64], failChance: 0.02 },
  color: { baseConfidence: 0.91, jitter: 0.04, lowChance: 0.1, lowRange: [0.5, 0.66], failChance: 0.02 },
};

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DemoProviderArgs {
  modelType: ModelType;
  groundTruthValue: string;
  label: string;
}

export function createDemoModelProvider(args: DemoProviderArgs): ModelProvider {
  const profile = PROFILES[args.modelType];
  const isPlate = args.modelType === 'plate';
  const unreadable = isPlate && !args.groundTruthValue.trim();

  return {
    id: `demo-${args.modelType}`,
    name: args.label,
    modelType: args.modelType,
    kind: 'demo',
    async predict(frame: ModelFrameInput, ctx?: ModelProviderContext) {
      const rng = mulberry32(
        hashSeed(`${args.modelType}:${frame.index}:${ctx?.seed ?? 'aegis'}`),
      );

      if (unreadable) {
        return { value: '', confidence: rng() * 0.3, status: 'ok' };
      }

      if (rng() < profile.failChance) {
        return { value: '', confidence: 0, status: 'failed', error: 'model error' };
      }

      const low = rng() < profile.lowChance;
      const confidence = low
        ? profile.lowRange[0] + rng() * (profile.lowRange[1] - profile.lowRange[0])
        : Math.min(0.995, Math.max(0.7, profile.baseConfidence + (rng() - 0.5) * profile.jitter));

      return {
        value: args.groundTruthValue,
        confidence: Number(confidence.toFixed(3)),
        status: 'ok',
      };
    },
  };
}
