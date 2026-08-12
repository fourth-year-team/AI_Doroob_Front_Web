/**
 * VideoSource abstraction (NFR-4).
 * Separates where the video comes from (recorded file today, live camera later)
 * from the rest of the analysis pipeline.
 */

export type VideoSourceKind = 'recorded-file' | 'object-url';

export interface VideoSourceInfo {
  id: string;
  label: string;
  src: string;
  kind: VideoSourceKind;
}

export interface VideoSource {
  readonly info: VideoSourceInfo;
  /** Returns a reusable <video> element ready to play. */
  load(): Promise<HTMLVideoElement>;
  getDuration(): Promise<number>;
  /** Captures a thumbnail (data URL) at the given time in seconds. */
  getThumbnail(timeSec: number): Promise<string>;
  release(): void;
}

function loadVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onError);
    };
    const onMeta = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => {
      cleanup();
      reject(new Error('Video load failed'));
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onError);
    video.src = src;
    video.load();
  });
}

const objectUrls = new Set<string>();

export function createObjectUrlSource(
  id: string,
  label: string,
  file: File,
): VideoSource {
  const url = URL.createObjectURL(file);
  objectUrls.add(url);
  return createBlobUrlSource(id, label, url);
}

export function createBlobUrlSource(id: string, label: string, url: string): VideoSource {
  objectUrls.add(url);
  return new BrowserVideoSource({
    id,
    label,
    src: url,
    kind: 'object-url',
  });
}

export function createRecordedVideoSource(id: string, path: string): VideoSource {
  return new BrowserVideoSource({
    id,
    label: path,
    src: path,
    kind: 'recorded-file',
  });
}

class BrowserVideoSource implements VideoSource {
  readonly info: VideoSourceInfo;
  private element: HTMLVideoElement | null = null;

  constructor(info: VideoSourceInfo) {
    this.info = info;
  }

  async load(): Promise<HTMLVideoElement> {
    if (this.element && this.element.readyState >= 1) return this.element;
    this.element = await loadVideoElement(this.info.src);
    return this.element;
  }

  async getDuration(): Promise<number> {
    const el = await this.load();
    return Number.isFinite(el.duration) ? el.duration : 0;
  }

  async getThumbnail(timeSec: number): Promise<string> {
    const el = await this.load();
    return captureFrameDataUrl(el, timeSec, 640);
  }

  release(): void {
    if (this.element) {
      this.element.removeAttribute('src');
      this.element.load();
      this.element = null;
    }
    if (this.info.kind === 'object-url') {
      URL.revokeObjectURL(this.info.src);
      objectUrls.delete(this.info.src);
    }
  }
}

export function captureFrameDataUrl(
  video: HTMLVideoElement,
  timeSec: number,
  maxWidth = 960,
): Promise<string> {
  return seekAndCapture(video, timeSec, maxWidth).then((r) => r.dataUrl);
}

export function seekAndCapture(
  video: HTMLVideoElement,
  timeSec: number,
  maxWidth = 960,
): Promise<{ dataUrl: string; imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      try {
        const scale = Math.min(1, maxWidth / video.videoWidth);
        const width = Math.round(video.videoWidth * scale);
        const height = Math.round(video.videoHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas 2D not supported'));
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.82), imageData, width, height });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    video.addEventListener('seeked', onSeeked);
    try {
      video.currentTime = timeSec;
    } catch {
      video.removeEventListener('seeked', onSeeked);
      reject(new Error('Seek failed'));
    }
    if (video.readyState >= 1 && Math.abs(video.currentTime - timeSec) < 0.02) {
      video.removeEventListener('seeked', onSeeked);
      onSeeked();
    }
  });
}

export function releaseAllObjectUrls(): void {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls.clear();
}
