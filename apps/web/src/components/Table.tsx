import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyText?: string;
  emptyComponent?: React.ReactNode;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyText = 'No records found',
  emptyComponent,
  className = '',
  onRowClick,
}: TableProps<T>) {
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${getAlignClass(
                  col.align
                )} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading table records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                {emptyComponent || emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={keyExtractor(item, rowIdx)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors duration-100 ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-6 py-4 text-sm text-slate-700 ${getAlignClass(
                      col.align
                    )} ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(item, rowIdx)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
