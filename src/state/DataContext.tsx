import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import mockData from '../data/mock-bookings.json';
import type {
  AnalysisSettings,
  AnalysisSession,
  Booking,
  SessionRecord,
  VideoStatus,
  AnalysisProgress,
} from '../types';
import { storage } from '../services/storage';
import { loadSettings, DEFAULT_SETTINGS } from '../services/settings';
import { runAnalysis } from '../services/analysisRunner';
import { bookingsFromCsv } from '../services/importExport';

interface FilterState {
  query: string;
  status: 'all' | 'matched' | 'mismatch' | 'review' | 'ready';
  onlyMismatches: boolean;
}

export interface RunningState {
  videoId: string | null;
  progress: AnalysisProgress;
  batch: { total: number; done: number } | null;
}

interface DataContextValue {
  bookings: Array<Booking & { status: VideoStatus; lastDecision: string | null }>;
  sessions: AnalysisSession[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredBookings: Array<Booking & { status: VideoStatus; lastDecision: string | null }>;
  settings: AnalysisSettings;
  updateSettings: (patch: Partial<AnalysisSettings>) => void;
  resetSettings: () => void;
  running: RunningState | null;
  runSingle: (booking: Booking) => Promise<SessionRecord>;
  runBatch: (bookings: Booking[]) => Promise<SessionRecord[]>;
  getSessionRecord: (sessionId: string) => SessionRecord | null;
  latestSessionFor: (videoId: string) => AnalysisSession | undefined;
  addBooking: (booking: Booking) => void;
  importBookings: (csvText: string) => { count: number };
  removeBooking: (videoId: string) => void;
  clearAllResults: () => void;
  lastError: string | null;
  clearError: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const defaultBookings = (mockData as { bookings: Booking[] }).bookings;

export function statusForVideo(session?: AnalysisSession): VideoStatus {
  if (!session) return 'ready';
  if (session.status === 'processing') return 'processing';
  switch (session.final_decision) {
    case 'clean':
      return 'matched';
    case 'fraud':
      return 'mismatch';
    default:
      return 'review';
  }
}

export function errorCodeFrom(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('no-frames')) return 'no-frames';
  if (msg.includes('mp4') || msg.includes('format')) return 'unsupported';
  return 'invalid-video';
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [customBookings, setCustomBookings] = useState<Booking[]>(() =>
    storage.getCustomBookings().filter((b) => !b.video_path.startsWith('blob:')),
  );
  const [sessions, setSessions] = useState<AnalysisSession[]>(() =>
    storage.getSessions(),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    status: 'all',
    onlyMismatches: false,
  });
  const [settings, setSettings] = useState<AnalysisSettings>(loadSettings);
  const [running, setRunning] = useState<RunningState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshSessions = useCallback(() => {
    setSessions(storage.getSessions());
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const bookings = useMemo<Array<Booking & { status: VideoStatus; lastDecision: string | null }>>(
    () => {
      const all = [...defaultBookings, ...customBookings];
      return all.map((b) => {
        const session = sessions.find((s) => s.video_id === b.video_id && s.status === 'completed');
        return {
          ...b,
          status: statusForVideo(session),
          lastDecision: session?.final_decision ?? null,
        };
      });
    },
    [customBookings, sessions],
  );

  const filteredBookings = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchQuery =
        !q ||
        b.video_id.toLowerCase().includes(q) ||
        b.plate_declared.toLowerCase().includes(q) ||
        b.model_declared.toLowerCase().includes(q) ||
        b.color_declared.toLowerCase().includes(q) ||
        (b.description ?? '').toLowerCase().includes(q);
      const matchStatus = filters.status === 'all' || b.status === filters.status;
      const matchMismatch = !filters.onlyMismatches || b.status === 'mismatch';
      return matchQuery && matchStatus && matchMismatch;
    });
  }, [bookings, filters]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const updateSettings = useCallback((patch: Partial<AnalysisSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    storage.saveSettings(DEFAULT_SETTINGS);
  }, []);

  const runSingle = useCallback(
    async (booking: Booking): Promise<SessionRecord> => {
      setLastError(null);
      const activeSettings = storage.getSettings() ?? loadSettings();
      setRunning({
        videoId: booking.video_id,
        progress: { stage: 'idle', percent: 0, message: '' },
        batch: null,
      });
      try {
        const record = await runAnalysis({
          booking,
          settings: activeSettings,
          onProgress: (progress) =>
            setRunning({ videoId: booking.video_id, progress, batch: null }),
        });
        refreshSessions();
        return record;
      } catch (err) {
        const code = errorCodeFrom(err);
        const session: AnalysisSession = {
          session_id: `${Date.now().toString(36)}`,
          video_id: booking.video_id,
          video_path: booking.video_path,
          scenario_type: booking.scenario_type,
          timestamp: new Date().toISOString(),
          status: 'failed',
          final_decision: 'review',
          settings: activeSettings,
          frameCount: 0,
          reason: 'analysis.failed',
          error: code,
        };
        storage.saveSession(session);
        refreshSessions();
        setLastError(code);
        throw err;
      } finally {
        setRunning((r) => (r?.videoId === booking.video_id ? null : r));
      }
    },
    [refreshSessions],
  );

  const runBatch = useCallback(
    async (batch: Booking[]): Promise<SessionRecord[]> => {
      setLastError(null);
      const records: SessionRecord[] = [];
      setRunning({
        videoId: batch[0]?.video_id ?? null,
        progress: { stage: 'idle', percent: 0, message: '' },
        batch: { total: batch.length, done: 0 },
      });
      let index = 0;
      for (const booking of batch) {
        const activeSettings = storage.getSettings() ?? loadSettings();
        try {
          const record = await runAnalysis({
            booking,
            settings: activeSettings,
            onProgress: (progress) =>
              setRunning({
                videoId: booking.video_id,
                progress,
                batch: { total: batch.length, done: index },
              }),
          });
          records.push(record);
        } catch {
          /* failed session already stored */
        }
        index++;
        setRunning((r) =>
          r
            ? {
                videoId: batch[index]?.video_id ?? null,
                progress: { stage: 'idle', percent: 0, message: '' },
                batch: { total: batch.length, done: index },
              }
            : r,
        );
      }
      refreshSessions();
      setRunning(null);
      return records;
    },
    [refreshSessions],
  );

  const getSessionRecord = useCallback(
    (sessionId: string): SessionRecord | null => {
      const session = storage.getSession(sessionId);
      if (!session) return null;
      return {
        session,
        frames: storage.getFrames(sessionId),
        aggregated: storage.getAggregated(sessionId),
      };
    },
    [],
  );

  const latestSessionFor = useCallback(
    (videoId: string) => sessions.find((s) => s.video_id === videoId && s.status === 'completed'),
    [sessions],
  );

  const addBooking = useCallback((booking: Booking) => {
    setCustomBookings((prev) => {
      const next = [...prev.filter((b) => b.video_id !== booking.video_id), booking];
      storage.saveCustomBookings(next);
      return next;
    });
  }, []);

  const importBookings = useCallback(
    (csvText: string) => {
      const imported = bookingsFromCsv(csvText);
      setCustomBookings((prev) => {
        const ids = new Set(prev.map((b) => b.video_id));
        const fresh = imported.filter((b) => !ids.has(b.video_id));
        const next = [...prev, ...fresh];
        storage.saveCustomBookings(next);
        return next;
      });
      return { count: imported.length };
    },
    [],
  );

  const removeBooking = useCallback((videoId: string) => {
    setCustomBookings((prev) => {
      const next = prev.filter((b) => b.video_id !== videoId);
      storage.saveCustomBookings(next);
      return next;
    });
  }, []);

  const clearAllResults = useCallback(() => {
    storage.clearSessions();
    refreshSessions();
  }, [refreshSessions]);

  const clearError = useCallback(() => setLastError(null), []);

  const value = useMemo<DataContextValue>(
    () => ({
      bookings,
      sessions,
      selectedIds,
      toggleSelect,
      clearSelection,
      filters,
      setFilters,
      filteredBookings,
      settings,
      updateSettings,
      resetSettings,
      running,
      runSingle,
      runBatch,
      getSessionRecord,
      latestSessionFor,
      addBooking,
      importBookings,
      removeBooking,
      clearAllResults,
      lastError,
      clearError,
    }),
    [
      bookings,
      sessions,
      selectedIds,
      toggleSelect,
      clearSelection,
      filters,
      filteredBookings,
      settings,
      updateSettings,
      resetSettings,
      running,
      runSingle,
      runBatch,
      getSessionRecord,
      latestSessionFor,
      addBooking,
      importBookings,
      removeBooking,
      clearAllResults,
      lastError,
      clearError,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
