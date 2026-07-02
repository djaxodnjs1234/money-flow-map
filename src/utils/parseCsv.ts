import Papa from "papaparse";

export interface ParsedTable {
  id?: string;
  title?: string;
  sheetName?: string;
  sourceKind?: "generic" | "banksalad-cashflow" | "banksalad-ledger";
  summary?: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export function parseCsvFile(file: File): Promise<ParsedTable> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0]?.message ?? "CSV 파싱 중 오류가 발생했습니다."));
          return;
        }

        const headers = result.meta.fields?.filter(Boolean) ?? [];
        resolve({ headers, rows: result.data });
      },
      error: (error) => reject(error),
    });
  });
}
