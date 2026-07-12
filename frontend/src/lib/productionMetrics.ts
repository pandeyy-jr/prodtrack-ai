import type { HourlyEntry, HourlyStatus, ShiftMetrics } from '../types/production';

export const DEFAULT_TARGET_PIECES = 2500;

export const SHIFT_TIME_SLOTS = {
  A: ['8-9', '9-10', '10-11', '11-12', '12-1', '1-2', '2-3', '3-4'],
  B: ['4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12'],
  C: ['12-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8'],
} as const;

export const createHourlyEntries = (shift: keyof typeof SHIFT_TIME_SLOTS): HourlyEntry[] =>
  SHIFT_TIME_SLOTS[shift].map((timeSlot) => ({ timeSlot, pieces: '' }));

export const parsePieces = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
};

export const getHourlyStatus = (
  pieces: number | null,
  expectedPerHour: number,
): HourlyStatus => {
  if (pieces === null || expectedPerHour <= 0) return 'Pending';

  const percentage = (pieces / expectedPerHour) * 100;
  if (percentage >= 100) return 'Good';
  if (percentage >= 80) return 'Warning';
  return 'Poor';
};

export const getShiftStatus = (efficiency: number, filledHours: number): HourlyStatus => {
  if (filledHours === 0) return 'Pending';
  if (efficiency >= 100) return 'Good';
  if (efficiency >= 80) return 'Warning';
  return 'Poor';
};

export const calculateShiftMetrics = (
  entries: HourlyEntry[],
  targetPieces: number,
): ShiftMetrics => {
  const safeTarget = Math.max(0, Math.trunc(targetPieces));
  const expectedPerHour = entries.length > 0 ? safeTarget / entries.length : 0;

  const hourlyResults = entries.map((entry) => {
    const pieces = parsePieces(entry.pieces);
    const percentage =
      pieces !== null && expectedPerHour > 0 ? (pieces / expectedPerHour) * 100 : null;

    return {
      timeSlot: entry.timeSlot,
      pieces,
      expectedPieces: expectedPerHour,
      percentage,
      status: getHourlyStatus(pieces, expectedPerHour),
    };
  });

  const totalPieces = hourlyResults.reduce((sum, item) => sum + (item.pieces ?? 0), 0);
  const filledHours = hourlyResults.filter((item) => item.pieces !== null).length;
  const efficiency = safeTarget > 0 ? (totalPieces / safeTarget) * 100 : 0;

  return {
    totalPieces,
    targetPieces: safeTarget,
    expectedPerHour,
    efficiency,
    status: getShiftStatus(efficiency, filledHours),
    filledHours,
    hourlyResults,
  };
};
