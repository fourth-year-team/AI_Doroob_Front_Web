/**
 * Local demo adapter implementing AnalysisService.
 * Runs the in-browser demo pipeline (analysisRunner + demo models) and returns
 * the result shaped as an AnalysisResponse. Temporary implementation until the
 * backend contract is agreed; swap createAnalysisService for a remote adapter.
 */

import type { AnalysisProgress, Booking } from '../../types';
import { runAnalysis } from '../analysisRunner';
import { mapSessionRecordToResponse, requestToSettings } from './mapping';
import type { AnalysisService } from './analysisService';
import type { AnalysisRequest, AnalysisResponse } from './types';

export interface LocalAnalysisDeps {
  resolveBooking: (videoId: string) => Booking | undefined;
}

export function createLocalAnalysisService(deps: LocalAnalysisDeps): AnalysisService {
  return {
    id: 'local-demo',
    kind: 'local',
    async analyze(
      request: AnalysisRequest,
      onProgress?: (progress: AnalysisProgress) => void,
    ): Promise<AnalysisResponse> {
      const booking = deps.resolveBooking(request.video_id);
      if (!booking) {
        throw new Error('missing-booking');
      }
      const settings = requestToSettings(request);
      const record = await runAnalysis({
        booking,
        settings,
        onProgress,
        persist: false,
      });
      return mapSessionRecordToResponse(record, booking);
    },
  };
}
