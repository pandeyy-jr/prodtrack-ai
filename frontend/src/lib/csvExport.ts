import type { ShiftReport } from '../types/production';

const escapeCsv = (value: string | number | boolean | null) => {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportReportsCsv = (reports: ShiftReport[]) => {
  const headers = [
    'Date',
    'Shift',
    'Machine',
    'Toy Code',
    'Total Pieces',
    'Target Pieces',
    'Efficiency %',
    'Status',
    'Reviewed',
    'Admin Remark',
  ];

  const rows = reports.map((report) => [
    report.date,
    report.shift,
    report.machine_no,
    report.toy_code,
    report.total_pieces,
    report.target_pieces,
    report.efficiency.toFixed(2),
    report.status,
    report.reviewed,
    report.admin_remark,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `production-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportReportsXlsx = async (reports: ShiftReport[]) => {
  const rows = reports.map((report) => ({
    Date: report.date,
    Shift: report.shift,
    Machine: report.machine_no,
    Product: report.toy_code,
    'Total Pieces': report.total_pieces,
    'Target Pieces': report.target_pieces,
    'Efficiency %': report.efficiency,
    Status: report.status,
    Reviewed: report.reviewed ? 'Yes' : 'No',
    'Admin Remark': report.admin_remark ?? '',
  }));
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reports');
  worksheet.columns = Object.keys(rows[0] ?? {
    Date: '',
    Shift: '',
    Machine: '',
    Product: '',
  }).map((key) => ({ header: key, key, width: Math.max(14, key.length + 2) }));
  rows.forEach((row) => worksheet.addRow(row));
  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `production-reports-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const printReportsPdf = () => window.print();
