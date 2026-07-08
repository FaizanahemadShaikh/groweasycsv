'use client';

import React, { useState } from 'react';

interface CsvPreviewProps {
  data: Array<Record<string, string>>;
  headers: Array<string>;
}

export default function CsvPreview({ data, headers }: CsvPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || data.length === 0) return null;

  // Filter rows based on search input
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-foreground">Parsed CSV Preview</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Showing raw records parsed locally. No AI has been run yet.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20">
            Total Rows: {data.length}
          </span>
          <input
            type="text"
            placeholder="Search raw data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 text-sm bg-background border border-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/45 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Scrollable Container for Responsiveness */}
      <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-border scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-muted text-foreground border-b border-border sticky top-0 z-10">
              <th className="px-4 py-3 font-bold w-16 text-center select-none bg-muted">#</th>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 font-bold tracking-wider whitespace-nowrap bg-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-muted/50 transition-colors duration-150 odd:bg-muted/20"
                >
                  <td className="px-4 py-2.5 text-center text-muted-foreground font-mono select-none">
                    {rowIdx + 1}
                  </td>
                  {headers.map((header, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-4 py-2.5 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis text-foreground"
                      title={String(row[header] || '')}
                    >
                      {String(row[header] || '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  No rows matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
