import { useEffect, useState } from 'react';
import { createRecordedVideoSource, createBlobUrlSource } from '../services/videoSource';
import { extractFrames } from '../services/frameExtractor';
import type { AnalysisSettings, FrameExtracted } from '../types';

interface FrameImagesState {
  frames: FrameExtracted[];
  loading: boolean;
  error: string | null;
}

export function useFrameImages(
  videoPath: string,
  settings: AnalysisSettings,
): FrameImagesState {
  const [state, setState] = useState<FrameImagesState>({ frames: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ frames: [], loading: true, error: null });

    const source = videoPath.startsWith('blob:')
      ? createBlobUrlSource('results', videoPath, videoPath)
      : createRecordedVideoSource('results', videoPath);

    extractFrames(source, {
      intervalSeconds: settings.frameIntervalSeconds,
      maxFrames: settings.maxFrames,
      maxWidth: 480,
    })
      .then((res) => {
        if (!cancelled) setState({ frames: res.frames, loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ frames: [], loading: false, error: 'video-load' });
      })
      .finally(() => {
        if (!cancelled) source.release();
      });

    return () => {
      cancelled = true;
      source.release();
    };
  }, [videoPath, settings.frameIntervalSeconds, settings.maxFrames]);

  return state;
}
