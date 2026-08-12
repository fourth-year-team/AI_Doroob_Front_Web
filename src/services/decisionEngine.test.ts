import { describe, expect, it } from 'vitest';
import { decide } from './decisionEngine';

const thresholds = { plate: 0.7, model: 0.7, color: 0.7 };

const declared = {
  plate: 'KLM-8832',
  model: 'Toyota Corolla',
  color: 'White',
};

function detected(partial: Partial<{ plate: [string, number]; model: [string, number]; color: [string, number] }>) {
  const p = partial.plate ?? ['KLM-8832', 0.94];
  const m = partial.model ?? ['Toyota Corolla', 0.92];
  const c = partial.color ?? ['White', 0.9];
  return {
    plate: { value: p[0], confidence: p[1] },
    model: { value: m[0], confidence: m[1] },
    color: { value: c[0], confidence: c[1] },
  };
}

describe('decision engine — clean', () => {
  it('all elements match -> clean decision', () => {
    const result = decide(declared, detected({}), { thresholds });
    expect(result.level).toBe('clean');
    expect(result.elements.every((e) => e.verdict === 'MATCH')).toBe(true);
    expect(result.alertElements.length).toBe(0);
  });

  it('plate normalization ignores case, dashes and spaces', () => {
    const result = decide(declared, detected({ plate: ['klm 8832', 0.9] }), { thresholds });
    expect(result.elements.find((e) => e.type === 'plate')!.verdict).toBe('MATCH');
  });
});

describe('decision engine — fraud', () => {
  it('matching plate but different model -> fraud alert', () => {
    const result = decide(declared, detected({ model: ['Honda Civic', 0.91] }), { thresholds });
    expect(result.level).toBe('fraud');
    const alert = result.alertElements.find((e) => e.type === 'model');
    expect(alert).toBeDefined();
    expect(alert!.declared).toBe('Toyota Corolla');
    expect(alert!.detected).toBe('Honda Civic');
  });

  it('matching plate but different color -> fraud alert', () => {
    const result = decide(declared, detected({ color: ['Black', 0.93] }), { thresholds });
    expect(result.level).toBe('fraud');
    expect(result.alertElements.map((e) => e.type)).toContain('color');
  });

  it('different readable plate -> fraud alert', () => {
    const result = decide(declared, detected({ plate: ['ABC-9999', 0.95] }), { thresholds });
    expect(result.level).toBe('fraud');
    expect(result.alertElements.map((e) => e.type)).toContain('plate');
  });
});

describe('decision engine — review / unclear', () => {
  it('empty plate value -> review decision', () => {
    const result = decide(declared, detected({ plate: ['', 0.4] }), { thresholds });
    expect(result.level).toBe('review');
    expect(result.elements.find((e) => e.type === 'plate')!.verdict).toBe('UNCLEAR');
  });

  it('plate confidence below threshold -> review decision', () => {
    const result = decide(declared, detected({ plate: ['KLM-8832', 0.5] }), { thresholds });
    expect(result.level).toBe('review');
  });

  it('matching plate but unclear model -> review decision', () => {
    const result = decide(declared, detected({ model: ['', 0.3] }), { thresholds });
    expect(result.level).toBe('review');
  });

  it('matching plate but unclear color -> review decision', () => {
    const result = decide(declared, detected({ color: ['', 0.2] }), { thresholds });
    expect(result.level).toBe('review');
  });
});
