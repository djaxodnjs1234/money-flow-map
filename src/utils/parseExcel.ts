import readXlsxFile, { type CellValue } from "read-excel-file/browser";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../constants/categories";
import type { ParsedTable } from "./parseCsv";
import type { TransactionType } from "../types/transaction";

type ExcelSheet = {
  sheet?: string;
  name?: string;
  data?: CellValue[][];
};

const STANDARD_HEADERS = ["date", "type", "amount", "category", "description", "memo", "source"];
const MONTH_HEADER_PATTERN = /^\d{4}-\d{2}$/;

export async function parseExcelFile(file: File): Promise<ParsedTable[]> {
  const sheets = (await readXlsxFile(file)) as ExcelSheet[];

  if (sheets.length === 0) {
    throw new Error("엑셀 파일에서 시트를 찾을 수 없습니다.");
  }

  const detectedTables = sheets.flatMap((sheet, sheetIndex) =>
    detectTablesFromSheet(sheet, sheetIndex),
  );

  if (detectedTables.length > 0) {
    return detectedTables;
  }

  const firstSheet = sheets[0];
  if (!firstSheet?.data) {
    throw new Error("엑셀 파일에서 읽을 수 있는 행을 찾을 수 없습니다.");
  }

  return [rowsToGenericTable(firstSheet.data, getSheetName(firstSheet, 0))];
}

function detectTablesFromSheet(sheet: ExcelSheet, sheetIndex: number): ParsedTable[] {
  const rows = sheet.data ?? [];
  const sheetName = getSheetName(sheet, sheetIndex);
  const tables: ParsedTable[] = [];

  const cashflowTable = parseBankSaladCashflow(rows, sheetName);
  if (cashflowTable) {
    tables.push(cashflowTable);
  }

  const ledgerTable = parseBankSaladLedger(rows, sheetName);
  if (ledgerTable) {
    tables.push(ledgerTable);
  }

  return tables;
}

function parseBankSaladLedger(rows: CellValue[][], sheetName: string): ParsedTable | null {
  const headerIndex = rows.findIndex((row) =>
    hasHeaders(row, ["날짜", "타입", "대분류", "내용", "금액"]),
  );

  if (headerIndex < 0) {
    return null;
  }

  const table = rowsToTable(rows, headerIndex);
  const ledgerRows = table.rows.filter((row) => ["수입", "지출"].includes(String(row["타입"] ?? "")));
  const transferCount = table.rows.filter((row) => String(row["타입"] ?? "") === "이체").length;

  return {
    ...table,
    id: `${sheetName}:banksalad-ledger`,
    title: "가계부 내역",
    sheetName,
    sourceKind: "banksalad-ledger",
    rows: ledgerRows,
    summary:
      transferCount > 0
        ? `거래 원장 형식입니다. 이체 ${transferCount.toLocaleString("ko-KR")}건은 제외하고 수입/지출만 가져옵니다.`
        : "거래 원장 형식입니다. 수입/지출만 가져옵니다.",
  };
}

function parseBankSaladCashflow(rows: CellValue[][], sheetName: string): ParsedTable | null {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeCell(cell) === "항목") &&
    row.some((cell) => MONTH_HEADER_PATTERN.test(normalizeCell(cell))),
  );

  if (headerIndex < 0) {
    return null;
  }

  const headerRow = rows[headerIndex];
  const itemColumnIndex = headerRow.findIndex((cell) => normalizeCell(cell) === "항목");
  const monthColumns = headerRow
    .map((cell, index) => ({ month: normalizeCell(cell), index }))
    .filter(({ month }) => MONTH_HEADER_PATTERN.test(month));

  if (itemColumnIndex < 0 || monthColumns.length === 0) {
    return null;
  }

  let currentType: TransactionType = "income";
  const generatedRows: Record<string, unknown>[] = [];

  rows.slice(headerIndex + 1).forEach((row) => {
    const category = normalizeCell(row[itemColumnIndex]);

    if (!category) return;

    if (category.includes("월수입")) {
      currentType = "expense";
      return;
    }

    if (category.includes("월지출") || category.includes("순수입")) {
      return;
    }

    if (!isKnownFlowCategory(category, currentType)) {
      return;
    }

    monthColumns.forEach(({ month, index }) => {
      const amount = toNumber(row[index]);
      if (amount <= 0) return;

      generatedRows.push({
        date: `${month}-01`,
        type: currentType,
        amount,
        category,
        description: `${month} ${category} 월별 집계`,
        memo: "현금흐름현황에서 생성된 월별 집계",
        source: "현금흐름현황",
      });
    });
  });

  if (generatedRows.length === 0) {
    return null;
  }

  return {
    id: `${sheetName}:banksalad-cashflow`,
    title: "현금흐름현황",
    sheetName,
    sourceKind: "banksalad-cashflow",
    headers: STANDARD_HEADERS,
    rows: generatedRows,
    summary: "월별 카테고리 합계표입니다. 각 월/카테고리를 월 첫날의 집계 거래로 변환합니다.",
  };
}

function rowsToGenericTable(rows: CellValue[][], sheetName: string): ParsedTable {
  const headerIndex = rows.findIndex((row) => row.filter(isPresentCell).length >= 2);
  const table = rowsToTable(rows, Math.max(0, headerIndex));

  return {
    ...table,
    id: `${sheetName}:generic`,
    title: sheetName,
    sheetName,
    sourceKind: "generic",
  };
}

function rowsToTable(rows: CellValue[][], headerIndex: number): Pick<ParsedTable, "headers" | "rows"> {
  const headerRow = rows[headerIndex] ?? [];
  const headers = buildHeaders(headerRow);
  const bodyRows = rows.slice(headerIndex + 1);

  return {
    headers,
    rows: bodyRows.map((row) =>
    headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = row[index] ?? "";
      return acc;
    }, {}),
    ),
  };
}

function buildHeaders(headerRow: CellValue[]) {
  const seen = new Map<string, number>();

  return headerRow.map((cell, index) => {
    const base = normalizeCell(cell) || `열${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return count > 0 ? `${base}_${count + 1}` : base;
  });
}

function hasHeaders(row: CellValue[], requiredHeaders: string[]) {
  const normalized = row.map(normalizeCell);
  return requiredHeaders.every((header) => normalized.includes(header));
}

function normalizeCell(cell: CellValue) {
  if (cell instanceof Date) {
    return cell.toISOString().slice(0, 10);
  }

  return String(cell ?? "").trim();
}

function isPresentCell(cell: CellValue) {
  return normalizeCell(cell).length > 0;
}

function toNumber(cell: CellValue) {
  if (typeof cell === "number") {
    return Math.abs(cell);
  }

  const value = Number(normalizeCell(cell).replaceAll(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function isKnownFlowCategory(category: string, type: TransactionType) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (categories as readonly string[]).includes(category);
}

function getSheetName(sheet: ExcelSheet, index: number) {
  return sheet.sheet ?? sheet.name ?? `Sheet${index + 1}`;
}
