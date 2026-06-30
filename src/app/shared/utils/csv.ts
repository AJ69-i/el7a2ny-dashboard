export interface CsvColumn {
  key: string;
  label: string;
}

/** Build a CSV from rows + columns and trigger a download (browser only). */
export function downloadCsv(filename: string, rows: readonly unknown[], columns: CsvColumn[]): void {
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const header = columns.map((c) => esc(c.label)).join(',');
  const body = rows
    .map((r) => columns.map((c) => esc((r as Record<string, unknown>)[c.key])).join(','))
    .join('\n');

  // Prepend a BOM so Excel reads UTF-8 (keeps Arabic text intact).
  const csv = '﻿' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}
