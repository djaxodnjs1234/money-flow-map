import { useMemo, useState } from "react";
import { FileSpreadsheet, Layers3, Upload, XCircle } from "lucide-react";
import { REQUIRED_FIELDS, FIELD_LABELS, TRANSACTION_FIELDS, detectColumnMapping } from "../utils/columnMapping";
import { normalizeRows } from "../utils/normalizeTransaction";
import { parseCsvFile, type ParsedTable } from "../utils/parseCsv";
import { parseExcelFile } from "../utils/parseExcel";
import type { ColumnMapping } from "../types/transaction";

interface UploadBoxProps {
  onImport: (transactions: ReturnType<typeof normalizeRows>["transactions"]) => void;
}

export default function UploadBox({ onImport }: UploadBoxProps) {
  const [fileName, setFileName] = useState("");
  const [tables, setTables] = useState<ParsedTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const table = useMemo(
    () => tables.find((item, index) => getTableId(item, index) === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  const normalized = useMemo(() => {
    if (!table) return null;
    return normalizeRows(table.rows, mapping);
  }, [mapping, table]);

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setWarnings([]);
    setFileName(file.name);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const parsedTables =
        extension === "xlsx"
          ? await parseExcelFile(file)
          : [
              {
                ...(await parseCsvFile(file)),
                id: `${file.name}:csv`,
                title: "CSV 거래내역",
                sourceKind: "generic" as const,
              },
            ];
      const firstTable = parsedTables[0];

      if (!firstTable) {
        throw new Error("가져올 수 있는 표를 찾지 못했습니다.");
      }

      setTables(parsedTables);
      setSelectedTableId(getTableId(firstTable, 0));
      setMapping(detectColumnMapping(firstTable.headers));
    } catch (caught) {
      setTables([]);
      setSelectedTableId("");
      setError(caught instanceof Error ? caught.message : "파일을 읽을 수 없습니다.");
    }
  }

  function selectTable(tableId: string) {
    const nextTable = tables.find((item, index) => getTableId(item, index) === tableId);
    if (!nextTable) return;

    setSelectedTableId(tableId);
    setMapping(detectColumnMapping(nextTable.headers));
    setError("");
    setWarnings([]);
  }

  function importRows() {
    if (!normalized) return;

    if (normalized.errors.length > 0) {
      setError(normalized.errors.slice(0, 6).join("\n"));
      return;
    }

    onImport(normalized.transactions);
    setWarnings(normalized.warnings.slice(0, 6));
    setError("");
  }

  const missingRequiredFields = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  const canImport =
    Boolean(table) && missingRequiredFields.length === 0 && Boolean(normalized?.transactions.length);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">데이터 업로드</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            CSV, XLSX 파일을 가져와 수입과 지출 흐름으로 변환합니다.
          </p>
        </div>

        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
            isDragging
              ? "border-river bg-river text-white"
              : "border-slate-200 bg-ink text-white hover:bg-slate-700"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          파일 선택
          <input
            className="sr-only"
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
      </div>

      {fileName && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <FileSpreadsheet className="h-4 w-4 text-river" aria-hidden="true" />
          {fileName}
        </div>
      )}

      {error && (
        <pre className="mt-4 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </pre>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {table && (
        <>
          {tables.length > 1 && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <Layers3 className="h-4 w-4 text-river" aria-hidden="true" />
                불러올 데이터 선택
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                {tables.map((item, index) => {
                  const tableId = getTableId(item, index);
                  const selected = tableId === selectedTableId;

                  return (
                    <button
                      key={tableId}
                      type="button"
                      className={`rounded-md border p-3 text-left transition ${
                        selected
                          ? "border-river bg-white shadow-sm ring-2 ring-river/15"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      onClick={() => selectTable(tableId)}
                    >
                      <span className="block text-sm font-semibold text-ink">
                        {item.title ?? item.sheetName ?? `표 ${index + 1}`}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {item.summary ?? `${item.rows.length.toLocaleString("ko-KR")}행`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <strong className="font-semibold">{table.title ?? table.sheetName}</strong>
            {table.sheetName && table.title !== table.sheetName ? ` · ${table.sheetName}` : ""}
            {table.summary ? ` · ${table.summary}` : ""}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {TRANSACTION_FIELDS.map((field) => (
              <label key={field} className="text-sm font-medium text-slate-600">
                {FIELD_LABELS[field]}
                {REQUIRED_FIELDS.includes(field) && <span className="text-coral"> *</span>}
                <select
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
                  value={mapping[field] ?? ""}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field]: event.target.value || undefined,
                    }))
                  }
                >
                  <option value="">선택 안 함</option>
                  {table.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {missingRequiredFields.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <XCircle className="mt-0.5 h-4 w-4 text-coral" aria-hidden="true" />
              필수 컬럼을 매핑해주세요:{" "}
              {missingRequiredFields.map((field) => FIELD_LABELS[field]).join(", ")}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  {table.headers.map((header) => (
                    <th key={header} className="px-3 py-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.rows.slice(0, 5).map((row, index) => (
                  <tr key={index} className="text-slate-700">
                    {table.headers.map((header) => (
                      <td key={header} className="max-w-52 truncate px-3 py-2">
                        {formatPreviewValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              가져올 수 있는 거래 {normalized?.transactions.length ?? 0}건
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-river px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canImport}
              onClick={importRows}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              가져오기
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function getTableId(table: ParsedTable, index: number) {
  return table.id ?? `${table.sheetName ?? "table"}:${index}`;
}

function formatPreviewValue(value: unknown) {
  if (value instanceof Date) {
    const year = value.getFullYear();

    if (year <= 1900) {
      return [value.getHours(), value.getMinutes(), value.getSeconds()]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
    }

    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "");
}
