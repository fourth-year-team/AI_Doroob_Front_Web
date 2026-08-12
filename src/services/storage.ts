import type { AnalysisSession, FrameResult, AggregatedResult, AnalysisSettings } from '../types';
import type { Booking } from '../types';

export const STORAGE_KEYS = {
  sessions: 'aegis.sessions',
  frames: 'aegis.frames',
  aggregated: 'aegis.aggregated',
  customBookings: 'aegis.customBookings',
  settings: 'aegis.settings',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export const storage = {
  getSessions(): AnalysisSession[] {
    return read<AnalysisSession[]>(STORAGE_KEYS.sessions, []);
  },
  saveSession(session: AnalysisSession): void {
    const all = this.getSessions().filter((s) => s.session_id !== session.session_id);
    all.unshift(session);
    write(STORAGE_KEYS.sessions, all);
  },
  getSession(sessionId: string): AnalysisSession | undefined {
    return this.getSessions().find((s) => s.session_id === sessionId);
  },
  latestSessionForVideo(videoId: string): AnalysisSession | undefined {
    return this.getSessions().find((s) => s.video_id === videoId && s.status === 'completed');
  },
  clearSessions(): void {
    write(STORAGE_KEYS.sessions, []);
    write(STORAGE_KEYS.frames, []);
    write(STORAGE_KEYS.aggregated, []);
  },

  getFrames(sessionId: string): FrameResult[] {
    return read<FrameResult[]>(STORAGE_KEYS.frames, []).filter(
      (f) => f.session_id === sessionId,
    );
  },
  saveFrames(frames: FrameResult[]): void {
    if (frames.length === 0) return;
    const sessionId = frames[0].session_id;
    const all = read<FrameResult[]>(STORAGE_KEYS.frames, []).filter(
      (f) => f.session_id !== sessionId,
    );
    write(STORAGE_KEYS.frames, all.concat(frames));
  },

  getAggregated(sessionId: string): AggregatedResult[] {
    return read<AggregatedResult[]>(STORAGE_KEYS.aggregated, []).filter(
      (a) => a.session_id === sessionId,
    );
  },
  saveAggregated(results: AggregatedResult[]): void {
    if (results.length === 0) return;
    const sessionId = results[0].session_id;
    const all = read<AggregatedResult[]>(STORAGE_KEYS.aggregated, []).filter(
      (a) => a.session_id !== sessionId,
    );
    write(STORAGE_KEYS.aggregated, all.concat(results));
  },

  getCustomBookings(): Booking[] {
    return read<Booking[]>(STORAGE_KEYS.customBookings, []);
  },
  saveCustomBookings(bookings: Booking[]): void {
    write(STORAGE_KEYS.customBookings, bookings);
  },

  getSettings(): AnalysisSettings | null {
    return read<AnalysisSettings | null>(STORAGE_KEYS.settings, null);
  },
  saveSettings(settings: AnalysisSettings): void {
    write(STORAGE_KEYS.settings, settings);
  },
};
