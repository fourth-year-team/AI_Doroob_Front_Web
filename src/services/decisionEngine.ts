/**
 * Decision engine (FR-5.1..FR-5.4).
 * Compares aggregated model results against the booking reference and produces
 * a final decision with a human-readable reason.
 */

import type {
  ModelType,
  ElementVerdict,
  DecisionLevel,
  ScenarioType,
} from '../types';

export interface DeclaredValues {
  plate: string;
  model: string;
  color: string;
}

export interface DetectedValue {
  value: string;
  confidence: number;
}

export interface DetectedValues {
  plate: DetectedValue;
  model: DetectedValue;
  color: DetectedValue;
}

export interface ElementComparison {
  type: ModelType;
  declared: string;
  detected: string;
  confidence: number;
  verdict: ElementVerdict;
}

export interface DecisionResult {
  level: DecisionLevel;
  elements: ElementComparison[];
  reasonKey: string;
  alertElements: ElementComparison[];
}

export const REASON_KEYS = {
  clean: 'decision.reasonClean',
  fraudPlate: 'decision.reasonFraudPlate',
  fraudElements: 'decision.reasonFraudElements',
  review: 'decision.reasonReview',
  reviewElement: 'decision.reasonReviewElement',
} as const;

function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function compare(
  type: ModelType,
  declared: string,
  detected: string,
  confidence: number,
  threshold: number,
): ElementComparison {
  let verdict: ElementVerdict;
  if (detected.trim() === '' || confidence < threshold) {
    verdict = 'UNCLEAR';
  } else if (type === 'plate') {
    verdict = normalizePlate(declared) === normalizePlate(detected) ? 'MATCH' : 'MISMATCH';
  } else {
    verdict = normalizeText(declared) === normalizeText(detected) ? 'MATCH' : 'MISMATCH';
  }
  return { type, declared, detected, confidence, verdict };
}

export interface DecideOptions {
  thresholds: Record<ModelType, number>;
}

export function decide(
  declared: DeclaredValues,
  detected: DetectedValues,
  opts: DecideOptions,
): DecisionResult {
  const elements: ElementComparison[] = [
    compare('plate', declared.plate, detected.plate.value, detected.plate.confidence, opts.thresholds.plate),
    compare('model', declared.model, detected.model.value, detected.model.confidence, opts.thresholds.model),
    compare('color', declared.color, detected.color.value, detected.color.confidence, opts.thresholds.color),
  ];

  const plate = elements.find((e) => e.type === 'plate')!;
  const others = elements.filter((e) => e.type !== 'plate');
  const alertElements = elements.filter((e) => e.verdict !== 'MATCH');

  let level: DecisionLevel;
  let reasonKey: string;

  if (plate.verdict === 'UNCLEAR') {
    level = 'review';
    reasonKey = REASON_KEYS.review;
  } else if (plate.verdict === 'MISMATCH') {
    level = 'fraud';
    reasonKey = REASON_KEYS.fraudPlate;
  } else if (others.some((e) => e.verdict === 'MISMATCH')) {
    level = 'fraud';
    reasonKey = REASON_KEYS.fraudElements;
  } else if (others.some((e) => e.verdict === 'UNCLEAR')) {
    level = 'review';
    reasonKey = REASON_KEYS.reviewElement;
  } else {
    level = 'clean';
    reasonKey = REASON_KEYS.clean;
  }

  return { level, elements, reasonKey, alertElements };
}

export function decisionToVerdict(level: DecisionLevel): ElementVerdict {
  switch (level) {
    case 'clean':
      return 'MATCH';
    case 'fraud':
      return 'MISMATCH';
    case 'review':
      return 'UNCLEAR';
  }
}

export function expectedForScenario(scenario: ScenarioType): ElementVerdict {
  switch (scenario) {
    case 'clean':
      return 'MATCH';
    case 'fraud':
      return 'MISMATCH';
    case 'unclear':
      return 'UNCLEAR';
  }
}

export function isDecisionCorrect(
  scenario: ScenarioType,
  level: DecisionLevel,
): boolean {
  switch (scenario) {
    case 'fraud':
      return level === 'fraud';
    case 'unclear':
      return level === 'review';
    default:
      return level === 'clean';
  }
}
