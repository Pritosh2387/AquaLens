import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CommandTableColumn<T> {
  header: string;
  accessorKey?: keyof T;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface CommandTableProps<T> {
  columns: CommandTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  emptyMessage?: string;
  className?: string;
}

export function CommandTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Filter records...',
  searchFields = [],
  onRowClick,
  selectedKey,
  emptyMessage = 'No maritime telemetry records found',
  className,
}: CommandTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = row[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      // Fallback: search all primitive values in row
      return Object.values(row as Record<string, any>).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchFields]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div className={cn('crystalline-panel rounded-lg flex flex-col font-mono text-xs', className)}>
      {/* Table Controls / Search Bar */}
      {searchable && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#09152b]/80 border-b border-[rgba(56,189,248,0.12)]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-[#040a17] border border-slate-700/60 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="text-[11px] text-slate-400">
            SHOWING <span className="text-cyan-400 font-bold">{sortedData.length}</span> OF{' '}
            <span className="text-slate-300">{data.length}</span>
          </div>
        </div>
      )}

      {/* Responsive Table Scroll Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#071329]/90 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {columns.map((col, idx) => {
                const isSorted = sortConfig.key === col.accessorKey;
                return (
                  <th
                    key={idx}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                    className={cn(
                      'py-2.5 px-3.5 whitespace-nowrap select-none',
                      col.sortable && 'cursor-pointer hover:text-cyan-300 transition-colors',
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-cyan-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50 bg-[#040a17]/60">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-slate-400 italic font-mono"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const key = keyExtractor(row);
                const isSelected = selectedKey === key;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors font-mono',
                      onRowClick && 'cursor-pointer',
                      isSelected
                        ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-l-cyan-400'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={cn(
                          'py-2.5 px-3.5 whitespace-nowrap text-xs',
                          col.className
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '—')
                          : '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
