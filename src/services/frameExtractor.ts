import type { VideoSource } from './videoSource';
import { seekAndCapture } from './videoSource';
import type { FrameExtractionResult, FrameExtracted } from '../types';

export interface FrameExtractionOptions {
  intervalSeconds: number;
  maxFrames: number;
  maxWidth?: number;
  onProgress?: (done: number, total: number, timestamp: number) => void;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Frame capture timed out')), ms),
    ),
  ]);
}

export async function extractFrames(
  source: VideoSource,
  opts: FrameExtractionOptions,
): Promise<FrameExtractionResult> {
  const video = await source.load();
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (duration <= 0) {
    throw new Error('Video duration unavailable');
  }

  const step = Math.max(0.1, opts.intervalSeconds);
  const maxFrames = Math.max(1, opts.maxFrames);
  const total = Math.min(maxFrames, Math.max(1, Math.floor(duration / step)));
  const maxWidth = opts.maxWidth ?? 960;

  const frames: FrameExtracted[] = [];
  for (let i = 0; i < total; i++) {
    const timestamp = Math.min(i * step, Math.max(0, duration - 0.05));
    const captured = await withTimeout(
      seekAndCapture(video, timestamp, maxWidth),
      15000,
    );
    frames.push({
      index: i + 1,
      timestamp: Number(timestamp.toFixed(2)),
      imageDataUrl: captured.dataUrl,
      imageData: captured.imageData,
    });
    opts.onProgress?.(i + 1, total, timestamp);
  }

  return { frames, width: frames[0]?.imageData.width ?? 0, height: frames[0]?.imageData.height ?? 0 };
}
