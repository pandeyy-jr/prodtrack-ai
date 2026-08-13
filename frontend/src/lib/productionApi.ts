import type {
  BulkShiftSubmissionResponse,
  DetailedShiftReport,
  ProductionIntelligence,
  ShiftReport,
  ShiftSubmissionPayload,
  ShiftSubmissionResponse,
  MachineMaster,
} from '../types/production';
/**
 * Resolve API base at runtime to allow switching endpoints without rebuild.
 * Order of precedence:
 * 1. window.__API_BASE__ (can be injected at runtime)
 * 2. localStorage key `PRODTRACK_API_BASE`
 * 3. build-time env `VITE_API_BASE_URL`
 * 4. fallback to localhost:8001
 */
const getApiBase = () => {
  try {
    if (typeof window !== 'undefined') {
      // runtime injected global (useful for static hosting configuration)
      const win = window as any;
      if (win.__API_BASE__) return String(win.__API_BASE__);

      const stored = window.localStorage.getItem('PRODTRACK_API_BASE');
      if (stored) return stored;
    }
  } catch (e) {
    // ignore access errors in unusual environments
  }

  return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';
};

export const setApiBase = (url: string | null) => {
  if (typeof window === 'undefined') return;
  if (!url) {
    window.localStorage.removeItem('PRODTRACK_API_BASE');
  } else {
    window.localStorage.setItem('PRODTRACK_API_BASE', url);
  }
};

export const getApiBaseUrl = () => getApiBase();
const cache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const method = (init?.method ?? 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;
  const needsCache = method === 'GET';

  if (needsCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.promise as Promise<T>;
    }
  }

  const API_BASE = getApiBase();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  const payload = response.json() as Promise<T>;

  if (needsCache) {
    cache.set(cacheKey, { expiresAt: Date.now() + 5000, promise: payload });
  }

  return payload;
};

export const submitShift = (payload: ShiftSubmissionPayload) =>
  requestJson<ShiftSubmissionResponse>('/supervisor/submit-shift', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitBulkShifts = (reports: ShiftSubmissionPayload[]) =>
  requestJson<BulkShiftSubmissionResponse>('/supervisor/submit-bulk', {
    method: 'POST',
    body: JSON.stringify({ reports }),
  });

export const fetchMachines = () =>
  requestJson<MachineMaster[]>('/supervisor/machines');

export const fetchShiftReports = () => requestJson<ShiftReport[]>('/admin/reports');

export const fetchProductionIntelligence = () =>
  requestJson<ProductionIntelligence>('/admin/intelligence');

export const fetchShiftReport = (id: number) =>
  requestJson<DetailedShiftReport>(`/admin/report/${id}`);

export const updateReportReview = (
  id: number,
  payload: { reviewed: boolean; admin_remark: string | null },
) =>
  requestJson<{ message: string }>(`/admin/report/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
