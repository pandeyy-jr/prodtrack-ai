import type {
  BulkShiftSubmissionResponse,
  DetailedShiftReport,
  ProductionIntelligence,
  ShiftReport,
  ShiftSubmissionPayload,
  ShiftSubmissionResponse,
  MachineMaster,
} from '../types/production';
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'https://prodtrack-ai.onrender.com';
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
