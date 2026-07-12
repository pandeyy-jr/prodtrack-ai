import { useRef, useState } from 'react';
import type { HourlyEntry, ShiftMetrics } from '../types/production';
import StatusPill from './StatusPill';

interface HourlyProductionTableProps {
  entries: HourlyEntry[];
  metrics: ShiftMetrics;
  onEntryChange: (index: number, value: string) => void;
}

const HourlyProductionTable = ({
  entries,
  metrics,
  onEntryChange,
}: HourlyProductionTableProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const focusNext = (index: number) => {
    const nextInput = inputRefs.current[index + 1];
    if (nextInput) nextInput.focus();
  };

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr className="h-12 border-b border-white/[0.05] bg-[#0B1F1A] text-sm text-[#E8FDF5]/55">
              <th className="w-28 px-4 text-left font-medium">Hour</th>
              <th className="w-52 px-4 text-center font-medium">Pieces</th>
              <th className="w-40 px-4 text-center font-medium">Expected</th>
              <th className="w-36 px-4 text-right font-medium">Performance</th>
              <th className="w-32 px-4 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {entries.map((entry, index) => {
              const result = metrics.hourlyResults[index];
              const isActive = activeIndex === index;

              return (
                <tr
                  key={entry.timeSlot}
                  className={`h-16 transition ${isActive ? 'bg-[#A3FF12]/10' : index % 2 === 0 ? 'bg-[#102A24] hover:bg-[#15372F]' : 'bg-[#0B1F1A]/35 hover:bg-[#15372F]'}`}
                >
                  <td className="px-4 text-left text-sm font-medium text-[#E8FDF5]">
                    {entry.timeSlot}
                  </td>
                  <td className="px-4 text-center">
                    <input
                      ref={(node) => {
                        inputRefs.current[index] = node;
                      }}
                      inputMode="numeric"
                      value={entry.pieces}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(null)}
                      onChange={(event) =>
                        onEntryChange(index, event.target.value.replace(/\D/g, ''))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          focusNext(index);
                        }
                      }}
                      placeholder="Pieces"
                      className="h-11 w-full rounded-lg border border-white/[0.05] bg-[#0B1F1A] px-3 text-center text-lg font-medium text-[#E8FDF5] outline-none transition placeholder:text-[#E8FDF5]/35 focus:border-[#00FFC6]/60 focus:ring-2 focus:ring-[#00FFC6]/10"
                    />
                  </td>
                  <td className="px-4 text-center text-sm text-[#E8FDF5]/70">
                    {Math.round(result.expectedPieces).toLocaleString()} pcs/hr
                  </td>
                  <td className="px-4 text-right">
                    <span className="text-sm font-medium text-[#E8FDF5]">
                      {result.percentage === null ? '-' : `${result.percentage.toFixed(0)}%`}
                    </span>
                  </td>
                  <td className="px-4 text-center">
                    <StatusPill status={result.status} />
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

export default HourlyProductionTable;
