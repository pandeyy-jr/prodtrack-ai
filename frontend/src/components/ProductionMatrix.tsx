import { ClipboardCopy, Sparkles } from 'lucide-react';
import { useMemo, useRef } from 'react';
import type { ProductionMatrixRow, ShiftKey } from '../types/production';

interface ProductionMatrixProps {
  rows: ProductionMatrixRow[];
  shift: ShiftKey;
  timeSlots: readonly string[];
  validationErrors?: Record<string, string>;
  onChange: (rows: ProductionMatrixRow[]) => void;
}

const sanitize = (value: string) => value.replace(/\D/g, '');

const totalForRow = (row: ProductionMatrixRow) =>
  row.values.reduce((sum, value) => sum + (Number(value) || 0), 0);

const achievementForRow = (row: ProductionMatrixRow) =>
  row.targetPieces > 0 ? (totalForRow(row) / row.targetPieces) * 100 : 0;

const performanceClass = (value: string, expected: number) => {
  if (!value || expected <= 0) return 'bg-transparent';
  const ratio = Number(value) / expected;
  if (ratio < 0.8) return 'bg-[#FF4D4F]/10 text-[#FF8587]';
  if (ratio < 1) return 'bg-[#F59E0B]/10 text-[#F8BE58]';
  if (ratio < 1.2) return 'bg-[#00E676]/10 text-[#6EF2A5]';
  return 'bg-[#3B82F6]/12 text-[#80AEFF]';
};

const achievementClass = (achievement: number) => {
  if (achievement < 80) return 'text-[#FF7A7A]';
  if (achievement < 100) return 'text-[#FFC857]';
  if (achievement < 120) return 'text-[#A3FF12]';
  return 'text-[#7AA7FF]';
};

const ProductionMatrix = ({ rows, shift, timeSlots, validationErrors = {}, onChange }: ProductionMatrixProps) => {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const valueColumnCount = shift === 'C' ? 1 : timeSlots.length;
  const summary = useMemo(() => {
    const totals = rows.map(totalForRow);
    return {
      completed: totals.filter((value) => value > 0).length,
      totalPieces: totals.reduce((sum, value) => sum + value, 0),
    };
  }, [rows]);

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    onChange(
      rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              values: row.values.map((cell, cellIndex) =>
                cellIndex === columnIndex ? sanitize(value) : cell,
              ),
            }
          : row,
      ),
    );
  };

  const focusCell = (rowIndex: number, columnIndex: number) => {
    inputRefs.current.get(`${rowIndex}:${columnIndex}`)?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    columnIndex: number,
  ) => {
    let nextRow = rowIndex;
    let nextColumn = columnIndex;

    if (event.ctrlKey && event.key.toLowerCase() === 'd' && rowIndex > 0) {
      event.preventDefault();
      updateCell(rowIndex, columnIndex, rows[rowIndex - 1].values[columnIndex] ?? '');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      nextColumn = event.shiftKey ? columnIndex - 1 : columnIndex + 1;
      if (nextColumn < 0) {
        nextColumn = valueColumnCount - 1;
        nextRow -= 1;
      }
      if (nextColumn >= valueColumnCount) {
        nextColumn = 0;
        nextRow += 1;
      }
      if (nextRow >= 0 && nextRow < rows.length) focusCell(nextRow, nextColumn);
      return;
    }

    if (event.key === 'ArrowUp') nextRow -= 1;
    else if (event.key === 'ArrowDown' || event.key === 'Enter') nextRow += 1;
    else if (event.key === 'ArrowLeft') nextColumn -= 1;
    else if (event.key === 'ArrowRight') nextColumn += 1;
    else return;

    event.preventDefault();
    if (nextColumn < 0) {
      nextColumn = valueColumnCount - 1;
      nextRow -= 1;
    }
    if (nextColumn >= valueColumnCount) {
      nextColumn = 0;
      nextRow += 1;
    }
    if (nextRow >= 0 && nextRow < rows.length) focusCell(nextRow, nextColumn);
  };

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    startRow: number,
    startColumn: number,
  ) => {
    const pastedRows = event.clipboardData
      .getData('text')
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split('\t'));
    if (pastedRows.length === 0) return;
    event.preventDefault();

    const nextRows = rows.map((row) => ({ ...row, values: [...row.values] }));
    pastedRows.forEach((pastedRow, rowOffset) => {
      pastedRow.forEach((value, columnOffset) => {
        const rowIndex = startRow + rowOffset;
        const columnIndex = startColumn + columnOffset;
        if (nextRows[rowIndex] && columnIndex < valueColumnCount) {
          nextRows[rowIndex].values[columnIndex] = sanitize(value);
        }
      });
    });
    onChange(nextRows);
  };

  const copyRow = async (row: ProductionMatrixRow) => {
    await navigator.clipboard.writeText(row.values.join('\t'));
  };

  return (
    <div className="bg-white/[0.012]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span>{summary.completed} machine rows active</span>
        </div>
        <div className="font-medium text-text-primary">{summary.totalPieces.toLocaleString()} pieces entered</div>
      </div>
      <div className="max-h-[590px] overflow-auto">
      <table className="min-w-[1120px] border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-20 bg-[#0A171D]">
          <tr>
            <th className="sticky left-0 z-30 w-28 bg-[#0A171D] px-3 py-3.5 text-left text-xs font-semibold text-[#94A3B8]">
              Machine
            </th>
            <th className="sticky left-28 z-30 w-28 bg-[#0A171D] px-3 py-3.5 text-left text-xs font-semibold text-[#94A3B8]">
              Product
            </th>
            {(shift === 'C' ? ['Total Production'] : timeSlots).map((slot) => (
              <th key={slot} className="min-w-24 px-3 py-3.5 text-center text-xs font-semibold text-[#94A3B8]">
                {slot}
              </th>
            ))}
            <th className="min-w-28 px-3 py-3.5 text-right text-xs font-semibold text-[#94A3B8]">
              Total
            </th>
            <th className="min-w-28 px-3 py-3.5 text-right text-xs font-semibold text-[#94A3B8]">
              Target
            </th>
            <th className="min-w-32 px-3 py-3.5 text-right text-xs font-semibold text-[#94A3B8]">
              Achievement
            </th>
            <th className="w-14" aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const total = totalForRow(row);
            const achievement = achievementForRow(row);
            const expected = row.targetPieces / (shift === 'C' ? 1 : timeSlots.length);
            return (
              <tr key={row.machineNo} className="group transition hover:bg-white/[0.025]">
                <th className="sticky left-0 z-10 bg-[#0E2028] px-3 py-2 text-left font-semibold text-white">
                  {row.machineNo}
                </th>
                <td className="sticky left-28 z-10 bg-[#0E2028] px-3 py-2 text-[#00FFC8]">
                  {row.productCode}
                </td>
                {row.values.map((value, columnIndex) => (
                  <td key={`${row.machineNo}:${columnIndex}`} className="p-1">
                    <input
                      ref={(node) => {
                        const key = `${rowIndex}:${columnIndex}`;
                        if (node) inputRefs.current.set(key, node);
                        else inputRefs.current.delete(key);
                      }}
                      value={value}
                      inputMode="numeric"
                      type="text"
                      autoComplete="off"
                      aria-label={`${row.machineNo} ${shift === 'C' ? 'total production' : timeSlots[columnIndex]}`}
                      onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                      onPaste={(event) => handlePaste(event, rowIndex, columnIndex)}
                      className={`h-10 w-full min-w-20 rounded-lg border-0 px-2 text-center font-medium outline-none ring-inset transition focus:ring-2 focus:ring-[#00FFC8]/60 ${performanceClass(value, expected)} ${validationErrors[`${rowIndex}:${columnIndex}`] ? 'border border-[#FF4D4F]/40 bg-[#FF4D4F]/10' : ''}`}
                    />
                  </td>
                ))}
                <td className="px-3 text-right font-semibold">
                  {total.toLocaleString()}
                </td>
                <td className="px-3 text-right text-[#94A3B8]">
                  {row.targetPieces.toLocaleString()}
                </td>
                <td className={`px-3 text-right font-bold ${achievementClass(achievement)}`}>
                  {achievement.toFixed(1)}%
                </td>
                <td className="text-center">
                  <button
                    onClick={() => void copyRow(row)}
                    className="inline-flex h-8 w-8 items-center justify-center text-[#E8FDF5]/45 transition hover:text-[#00FFC6]"
                    title="Copy row values"
                  >
                    <ClipboardCopy size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ProductionMatrix;
