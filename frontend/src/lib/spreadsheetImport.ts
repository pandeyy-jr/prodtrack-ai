import { SHIFT_TIME_SLOTS } from './productionMetrics';
import type {
  ImportedProductionRow,
  ShiftKey,
  ShiftSubmissionPayload,
} from '../types/production';

type RawRow = Record<string, unknown>;

const cleanKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeRow = (row: RawRow): Record<string, unknown> =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [cleanKey(key), value]));

const textValue = (value: unknown) => String(value ?? '').trim();

const numberValue = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
};

const normalizeDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = textValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const normalizeShift = (value: unknown): ShiftKey | null => {
  const shift = textValue(value).toUpperCase().replace('SHIFT', '').trim();
  if (shift === '1' || shift === 'A') return 'A';
  if (shift === '2' || shift === 'B') return 'B';
  if (shift === '3' || shift === 'C') return 'C';
  return null;
};

export const parseProductionFile = async (file: File): Promise<ImportedProductionRow[]> => {
  const rawRows = file.name.toLowerCase().endsWith('.csv')
    ? parseCsv(await file.text())
    : await parseWorkbook(await file.arrayBuffer());
  const duplicateKeys = new Set<string>();

  return rawRows.map((source, index) => {
    const row = normalizeRow(source);
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalizedShift = normalizeShift(row.shift);
    const date = normalizeDate(row.date);
    const shift = normalizedShift;
    const machineNo = textValue(row.machine ?? row.machineno);
    const toyCode = textValue(row.product ?? row.toycode ?? row.productcode).toUpperCase();
    const targetPieces = numberValue(row.target ?? row.targetpieces) ?? 2500;

    if (!date) errors.push('Invalid or missing date');
    if (!shift) errors.push('Shift must be 1, 2, 3, A, B, or C');
    if (!machineNo) errors.push('Machine is required');
    if (!toyCode) errors.push('Product is required');
    if (targetPieces <= 0) errors.push('Target must be greater than zero');

    const hourValues = Array.from({ length: 8 }, (_, hourIndex) =>
      numberValue(row[`hour${hourIndex + 1}`] ?? row[`h${hourIndex + 1}`]),
    );
    const explicitTotal = numberValue(row.total ?? row.totalpieces);
    const hours =
      shift === 'C'
        ? []
        : hourValues.map((value, hourIndex) => {
            if (value === null) errors.push(`Hour ${hourIndex + 1} is missing or invalid`);
            return value ?? 0;
          });
    const totalPieces = shift === 'C' ? explicitTotal ?? 0 : hours.reduce((sum, value) => sum + value, 0);

    if (shift === 'C' && explicitTotal === null) errors.push('Shift 3 requires Total');
    if (totalPieces > targetPieces * 2) warnings.push('Output is above 200% of target');
    hours.forEach((value, hourIndex) => {
      const expected = targetPieces / 8;
      if (expected > 0 && value > expected * 2.5) {
        warnings.push(`Hour ${hourIndex + 1} is an outlier`);
      }
    });

    const duplicateKey = `${date}|${shift}|${machineNo.toUpperCase()}|${toyCode}`;
    if (duplicateKeys.has(duplicateKey)) errors.push('Duplicate row in uploaded file');
    duplicateKeys.add(duplicateKey);

    return {
      rowNumber: index + 2,
      date,
      shift: shift ?? 'A',
      machineNo,
      toyCode,
      targetPieces,
      hours,
      totalPieces,
      errors,
      warnings,
    };
  });
};

const parseCsv = (text: string): RawRow[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);

  const headers = rows.shift() ?? [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
};

const parseWorkbook = async (buffer: ArrayBuffer): Promise<RawRow[]> => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = (worksheet.getRow(1).values as unknown[]).slice(1).map(textValue);
  const rows: RawRow[] = [];
  worksheet.eachRow((worksheetRow, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (worksheetRow.values as unknown[]).slice(1);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
  });
  return rows;
};

export const importedRowToPayload = (row: ImportedProductionRow): ShiftSubmissionPayload => ({
  date: row.date,
  shift: row.shift,
  machine_no: row.machineNo,
  toy_code: row.toyCode,
  target_pieces: row.targetPieces,
  entries:
    row.shift === 'C'
      ? [{ time_slot: 'Shift Total', pieces: row.totalPieces }]
      : SHIFT_TIME_SLOTS[row.shift].map((timeSlot, index) => ({
          time_slot: timeSlot,
          pieces: row.hours[index],
        })),
});

export const downloadImportTemplate = async () => {
  const rows = [
    {
      Date: new Date().toISOString().slice(0, 10),
      Shift: 1,
      Machine: 'M-01',
      Product: 'TY-104',
      Target: 2500,
      Hour1: 310,
      Hour2: 320,
      Hour3: 305,
      Hour4: 330,
      Hour5: 315,
      Hour6: 325,
      Hour7: 318,
      Hour8: 327,
      Total: '',
    },
    {
      Date: new Date().toISOString().slice(0, 10),
      Shift: 3,
      Machine: 'M-02',
      Product: 'TY-208',
      Target: 2800,
      Hour1: '',
      Hour2: '',
      Hour3: '',
      Hour4: '',
      Hour5: '',
      Hour6: '',
      Hour7: '',
      Hour8: '',
      Total: 2720,
    },
  ];
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Production');
  worksheet.columns = Object.keys(rows[0]).map((key) => ({
    header: key,
    key,
    width: Math.max(12, key.length + 2),
  }));
  rows.forEach((row) => worksheet.addRow(row));
  const output = await workbook.xlsx.writeBuffer();
  downloadBuffer(output, 'prodtrack-import-template.xlsx');
};

const downloadBuffer = (buffer: ArrayBuffer, fileName: string) => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
