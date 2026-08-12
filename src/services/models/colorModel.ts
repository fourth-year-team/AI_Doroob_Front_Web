/**
 * Vehicle Color service.
 * Independent adapter unit (FR-4.6). Backed by REAL pixel analysis
 * (dominant HSV color from extracted frames). No simulation.
 */

import type { ModelProvider } from './types';
import { colorProvider } from './colorProvider';

export function createColorModel(): ModelProvider {
  return colorProvider;
}
