import { useEffect, useState } from 'react';
import { createRecordedVideoSource, createBlobUrlSource } from '../../services/videoSource';
import { Icon } from '../common/Icon';

interface VideoThumbnailProps {
  videoPath: string;
  label?: string;
  fallbackIcon?: 'video' | 'camera';
}

const thumbCache = new Map<string, { url: string; ok: boolean }>();

export function VideoThumbnail({ videoPath, label, fallbackIcon = 'video' }: VideoThumbnailProps) {
  const [thumb, setThumb] = useState<{ url: string; ok: boolean } | null>(
    () => thumbCache.get(videoPath) ?? null,
  );
  const [loading, setLoading] = useState(!thumbCache.has(videoPath));

  useEffect(() => {
    let cancelled = false;
    const cached = thumbCache.get(videoPath);
    if (cached) {
      setThumb(cached);
      setLoading(false);
      return;
    }

    const source = videoPath.startsWith('blob:')
      ? createBlobUrlSource('thumb', videoPath, videoPath)
      : createRecordedVideoSource('thumb', videoPath);

    source
      .getThumbnail(1)
      .then((url) => {
        if (cancelled) return;
        thumbCache.set(videoPath, { url, ok: true });
        setThumb({ url, ok: true });
      })
      .catch(() => {
        if (cancelled) return;
        thumbCache.set(videoPath, { url: '', ok: false });
        setThumb({ url: '', ok: false });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      source.release();
    };
  }, [videoPath]);

  if (loading) {
    return (
      <div className="thumb-placeholder" aria-hidden="true">
        <Icon name="video" size={30} />
      </div>
    );
  }

  if (thumb?.ok) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img className="thumb-img" src={thumb.url} alt={label ?? videoPath} loading="lazy" />
        <span className="thumb-scrim">
          <Icon name="camera" size={13} /> {label}
        </span>
      </div>
    );
  }

  return (
    <div className="thumb-placeholder" aria-hidden="true">
      <Icon name={fallbackIcon} size={30} />
      <span className="thumb-scrim">
        <Icon name="camera" size={13} /> {label}
      </span>
    </div>
  );
}
