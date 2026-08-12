import React from 'react';

export type IconName =
  | 'shield'
  | 'search'
  | 'video'
  | 'upload'
  | 'csv'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'user'
  | 'dashboard'
  | 'list'
  | 'report'
  | 'settings'
  | 'play'
  | 'check'
  | 'alert'
  | 'help'
  | 'close'
  | 'filter'
  | 'arrow'
  | 'clock'
  | 'camera'
  | 'plus'
  | 'queue'
  | 'info'
  | 'chevron'
  | 'warning'
  | 'refresh'
  | 'trash'
  | 'eye'
  | 'eye-off';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const PATHS: Record<IconName, React.ReactNode> = {
  shield: (
    <>
      <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" {...strokeProps} />
      <path d="M9 12l2 2 4-4" {...strokeProps} />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" {...strokeProps} />
      <path d="M21 21l-4.3-4.3" {...strokeProps} />
    </>
  ),
  video: (
    <>
      <rect x="2" y="6" width="13" height="12" rx="2" {...strokeProps} />
      <path d="M15 10l6-3v10l-6-3" {...strokeProps} />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" {...strokeProps} />
      <path d="M6 10l6-6 6 6" {...strokeProps} />
      <path d="M4 20h16" {...strokeProps} />
    </>
  ),
  csv: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...strokeProps} />
      <path d="M14 2v6h6" {...strokeProps} />
      <path d="M9 13l-2 2 2 2" {...strokeProps} />
      <path d="M15 13l2 2-2 2" {...strokeProps} />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" {...strokeProps} />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...strokeProps} />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...strokeProps} />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" {...strokeProps} />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" {...strokeProps} />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" {...strokeProps} />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" {...strokeProps} />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" {...strokeProps} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" {...strokeProps} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" {...strokeProps} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" {...strokeProps} />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" {...strokeProps} />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" />
    </>
  ),
  report: (
    <>
      <path d="M4 4h16v16H4z" {...strokeProps} />
      <path d="M4 14h16M4 18h16" {...strokeProps} />
      <path d="M8 10h8" {...strokeProps} />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" {...strokeProps} />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" {...strokeProps} />
    </>
  ),
  play: <path d="M6 4l14 8-14 8V4z" {...strokeProps} />,
  check: <path d="M20 6L9 17l-5-5" {...strokeProps} />,
  alert: (
    <>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" {...strokeProps} />
      <path d="M12 9v4M12 17h.01" {...strokeProps} />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" {...strokeProps} />
      <path d="M9.2 9a3 3 0 0 1 5.6 1.1c0 1.6-2.8 2.2-2.8 3.4" {...strokeProps} />
      <path d="M12 17h.01" {...strokeProps} />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" {...strokeProps} />,
  filter: (
    <>
      <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" {...strokeProps} />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" {...strokeProps} />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" {...strokeProps} />
      <path d="M12 7v5l3 2" {...strokeProps} />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...strokeProps} />
      <circle cx="12" cy="13" r="3.5" {...strokeProps} />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" {...strokeProps} />,
  queue: (
    <>
      <path d="M4 7h13M4 12h13M4 17h13" {...strokeProps} />
      <circle cx="19.5" cy="12" r="1.6" {...strokeProps} />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" {...strokeProps} />
      <path d="M12 8h.01M12 12v4" {...strokeProps} />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" {...strokeProps} />,
  warning: (
    <>
      <path d="M12 3L2 20h20L12 3z" {...strokeProps} />
      <path d="M12 10v4M12 17h.01" {...strokeProps} />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" {...strokeProps} />
      <path d="M20 3v5h-5" {...strokeProps} />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" {...strokeProps} />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" {...strokeProps} />
      <circle cx="12" cy="12" r="3" {...strokeProps} />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 3l18 18" {...strokeProps} />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.3M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1.1" {...strokeProps} />
    </>
  ),
};

export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
