import React from 'react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  emptyMessage = 'No telemetry data records found',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto border border-[rgba(56,189,248,0.15)] rounded-lg', className)}>
      <table className="w-full text-left text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0a162c]/90 text-slate-400 uppercase tracking-wider text-[11px]">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('py-2.5 px-3.5 font-semibold', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-[#071021]/60">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-slate-400 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = keyExtractor(row);
              const isSelected = selectedKey === key;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-800/40',
                    isSelected && 'bg-cyan-950/40 border-l-2 border-cyan-400'
                  )}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn('py-2.5 px-3.5 text-slate-200', col.className)}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
