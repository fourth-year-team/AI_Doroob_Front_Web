/**
 * Analysis service abstraction.
 * The UI talks to this interface only. The local demo adapter implements it
 * today; a real backend service can implement the same interface later without
 * any UI changes.
 */

import type { AnalysisProgress, Booking } from '../../types';
import type { AnalysisRequest, AnalysisResponse } from './types';
import { createLocalAnalysisService } from './localAnalysisService';

export interface AnalysisService {
  readonly id: string;
  readonly kind: 'local' | 'remote';
  analyze(
    request: AnalysisRequest,
    onProgress?: (progress: AnalysisProgress) => void,
  ): Promise<AnalysisResponse>;
}

export interface AnalysisServiceOptions {
  /** Resolves the full booking for a video id (used by the local demo adapter). */
  resolveBooking?: (videoId: string) => Booking | undefined;
}

/**
 * Factory. The backend contract is not agreed yet, so this always returns the
 * local demo adapter. Swap the return value for a remote service later.
 */
export function createAnalysisService(options: AnalysisServiceOptions = {}): AnalysisService {
  return createLocalAnalysisService({
    resolveBooking: options.resolveBooking ?? (() => undefined),
  });
}
