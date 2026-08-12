/**
 * Real pixel-based dominant color analysis.
 * Genuine computation on extracted frames — no simulation.
 * Analyzes a central region of interest (ROI) where the vehicle is expected.
 */

import type { ModelProvider, ModelFrameInput, PixelStats } from './types';
import type { ModelPrediction } from '../../types';

const PALETTE: Array<{ name: string; hueMin: number; hueMax: number }> = [
  { name: 'Red', hueMin: 0, hueMax: 14 },
  { name: 'Red', hueMin: 345, hueMax: 360 },
  { name: 'Orange', hueMin: 15, hueMax: 35 },
  { name: 'Yellow', hueMin: 36, hueMax: 62 },
  { name: 'Green', hueMin: 63, hueMax: 158 },
  { name: 'Cyan', hueMin: 159, hueMax: 199 },
  { name: 'Blue', hueMin: 200, hueMax: 255 },
  { name: 'Purple', hueMin: 256, hueMax: 289 },
  { name: 'Pink', hueMin: 290, hueMax: 344 },
];

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }
  return [h, s, l];
}

export function analyzeDominantColor(imageData: ImageData): PixelStats {
  const { data, width, height } = imageData;

  const rx0 = Math.floor(width * 0.12);
  const rx1 = Math.floor(width * 0.88);
  const ry0 = Math.floor(height * 0.2);
  const ry1 = Math.floor(height * 0.82);

  let black = 0;
  let white = 0;
  let gray = 0;
  let colorful = 0;
  let sumLight = 0;
  let sumSat = 0;
  let hueCount = 0;
  let hueSum = 0;
  const hist = new Float32Array(36);
  let count = 0;

  for (let y = ry0; y < ry1; y += 2) {
    for (let x = rx0; x < rx1; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const [h, s, l] = rgbToHsl(r, g, b);
      count++;
      sumLight += l;
      sumSat += s;

      if (l < 0.2) {
        black++;
      } else if (l > 0.72 && s < 0.2) {
        white++;
      } else if (s < 0.2) {
        gray++;
      } else {
        colorful++;
        const bucket = Math.floor(h / 10) % 36;
        hist[bucket]++;
        hueCount++;
        hueSum += h;
      }
    }
  }

  if (count === 0) {
    return {
      dominantColor: 'Gray',
      confidence: 0.5,
      averageBrightness: 0,
      averageSaturation: 0,
      dominantHue: 0,
      colorfulness: 0,
    };
  }

  const avgLight = sumLight / count;
  const avgSat = sumSat / count;
  const blackFrac = black / count;
  const whiteFrac = white / count;
  const grayFrac = gray / count;
  const colorfulFrac = colorful / count;

  let dominantColor = 'Gray';
  let confidence = 0.5;

  if (colorfulFrac > 0.35) {
    let bestBucket = 0;
    let bestCount = 0;
    for (let i = 0; i < 36; i++) {
      if (hist[i] > bestCount) {
        bestCount = hist[i];
        bestBucket = i;
      }
    }
    const dominantHue = bestBucket * 10 + 5;
    let hueFrac = bestCount / Math.max(1, colorful);
    if (avgSat > 0.55 && hueFrac > 0.3) hueFrac = Math.min(0.95, hueFrac + 0.12);
    const named = PALETTE.find(
      (p) => dominantHue >= p.hueMin && dominantHue < p.hueMax,
    );
    dominantColor = named ? named.name : 'Gray';
    confidence = Math.min(0.97, Math.max(0.55, hueFrac * 0.85));
  } else {
    const strongest = Math.max(blackFrac, whiteFrac, grayFrac);
    if (whiteFrac === strongest) {
      dominantColor = 'White';
    } else if (blackFrac === strongest) {
      dominantColor = 'Black';
    } else {
      dominantColor = avgLight > 0.55 ? 'White' : 'Gray';
    }
    confidence = Math.min(0.96, Math.max(0.55, strongest * 1.05));
  }

  return {
    dominantColor,
    confidence: Number(confidence.toFixed(3)),
    averageBrightness: Number(avgLight.toFixed(3)),
    averageSaturation: Number(avgSat.toFixed(3)),
    dominantHue: Number((hueCount ? hueSum / hueCount : 0).toFixed(1)),
    colorfulness: Number(colorfulFrac.toFixed(3)),
  };
}

export const colorProvider: ModelProvider = {
  id: 'color-real-pixel',
  name: 'Color Analyzer (pixel HSV)',
  modelType: 'color',
  kind: 'demo',
  async predict(frame: ModelFrameInput): Promise<ModelPrediction> {
    try {
      const stats = analyzeDominantColor(frame.imageData);
      return {
        value: stats.dominantColor,
        confidence: stats.confidence,
        status: 'ok',
      };
    } catch {
      return { value: '', confidence: 0, status: 'failed', error: 'color analysis failed' };
    }
  },
};
