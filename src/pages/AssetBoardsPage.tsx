import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAssetBoardsStore } from "../store/assetBoardsStore";
import { useFlowEntriesStore } from "../store/flowEntriesStore";
import type { AssetBoard } from "../types/assetBoard";
import type { FlowEntry, FlowPeriodType, SubcategoryAmount } from "../types/flow";
import type { TransactionType } from "../types/transaction";
import { getFlowSummaryMetrics } from "../utils/flowAggregate";
import { formatCompactKRW } from "../utils/format";

interface AssetBoardsPageProps {
  onOpenBoard: (boardId: string) => void;
}

interface BoardFormState {
  title: string;
  ownerName: string;
  description: string;
}

interface BoardBackupFile {
  app: "money-flow-map";
  version: 1;
  exportedAt: string;
  board: AssetBoard;
  entries: FlowEntry[];
}

type Notice = { tone: "success" | "error"; message: string } | null;

const EMPTY_FORM: BoardFormState = {
  title: "",
  ownerName: "",
  description: "",
};

const BACKUP_APP_ID = "money-flow-map";
const BACKUP_VERSION = 1;

export default function AssetBoardsPage({ onOpenBoard }: AssetBoardsPageProps) {
  const { boards, addBoard, updateBoard, deleteBoard } = useAssetBoardsStore();
  const entriesByBoardId = useFlowEntriesStore((state) => state.entriesByBoardId);
  const deleteBoardEntries = useFlowEntriesStore((state) => state.deleteBoardEntries);
  const replaceBoardEntries = useFlowEntriesStore((state) => state.replaceBoardEntries);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<AssetBoard | null>(null);
  const [form, setForm] = useState<BoardFormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  const boardRows = useMemo(
    () =>
      [...boards]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((board) => {
          const entries = entriesByBoardId[board.id] ?? [];
          return {
            board,
            entryCount: entries.length,
            metrics: getFlowSummaryMetrics(entries),
          };
        }),
    [boards, entriesByBoardId],
  );

  function openCreateForm() {
    setEditingBoard(null);
    setForm(EMPTY_FORM);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(board: AssetBoard) {
    setEditingBoard(board);
    setForm({
      title: board.title,
      ownerName: board.ownerName,
      description: board.description ?? "",
    });
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingBoard(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.ownerName.trim()) {
      setError("제목과 이름을 입력해주세요.");
      return;
    }

    if (editingBoard) {
      updateBoard(editingBoard.id, form);
      closeForm();
      return;
    }

    const board = addBoard(form);
    closeForm();
    onOpenBoard(board.id);
  }

  function handleDelete(board: AssetBoard) {
    const confirmed = window.confirm(`${board.title} 목록과 입력 데이터를 삭제할까요?`);
    if (!confirmed) return;

    deleteBoard(board.id);
    deleteBoardEntries(board.id);
    setNotice({ tone: "success", message: `${board.title} 목록을 삭제했습니다.` });
  }

  function handleExport(board: AssetBoard) {
    const backup: BoardBackupFile = {
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      board,
      entries: entriesByBoardId[board.id] ?? [],
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${toSafeFilename(board.title)}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice({ tone: "success", message: `${board.title} 백업 파일을 내보냈습니다.` });
  }

  async function handleImport(board: AssetBoard, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const backup = parseBackupFile(JSON.parse(await file.text()));
      const confirmed = window.confirm(
        `${board.title} 목록의 현재 입력 데이터를 가져온 백업으로 덮어쓸까요?`,
      );
      if (!confirmed) return;

      updateBoard(board.id, {
        title: backup.board.title,
        ownerName: backup.board.ownerName,
        description: backup.board.description,
      });
      replaceBoardEntries(board.id, backup.entries);
      setNotice({
        tone: "success",
        message: `${backup.entries.length.toLocaleString("ko-KR")}개 입력 내역을 가져왔습니다.`,
      });
    } catch {
      setNotice({
        tone: "error",
        message: "가져오기 실패: Money Flow Map 백업 JSON 파일인지 확인해주세요.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-river">Public Money Boards</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">자산관리 목록</h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
          onClick={openCreateForm}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          목록 추가
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
            notice.tone === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {notice.message}
        </div>
      )}

      {isFormOpen && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">
              {editingBoard ? "자산관리 목록 수정" : "새 자산관리 목록"}
            </h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              onClick={closeForm}
              aria-label="닫기"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                제목
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="예: 홍길동의 자산관리"
                />
              </label>

              <label className="text-sm font-medium text-slate-600">
                이름
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
                  value={form.ownerName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ownerName: event.target.value }))
                  }
                  placeholder="예: 홍길동"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-600">
              설명
              <textarea
                className="mt-1 min-h-20 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="선택 입력"
              />
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {editingBoard ? "수정 저장" : "추가 저장"}
            </button>
          </form>
        </section>
      )}

      <section className="grid gap-3 xl:grid-cols-2">
        {boardRows.map(({ board, entryCount, metrics }) => (
          <article
            key={board.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-river/10 px-2 py-1 text-xs font-semibold text-river">
                    <Database className="h-3.5 w-3.5" aria-hidden="true" />
                    DB {board.id}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    {board.ownerName}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-normal text-ink">
                  {board.title}
                </h2>
                {board.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">{board.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-river"
                  onClick={() => openEditForm(board)}
                  aria-label={`${board.title} 수정`}
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-coral"
                  onClick={() => handleDelete(board)}
                  aria-label={`${board.title} 삭제`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Metric label="입력" value={`${entryCount.toLocaleString("ko-KR")}개`} />
              <Metric label="수입" value={formatCompactKRW(metrics.totalIncome)} />
              <Metric label="잔액" value={formatCompactKRW(metrics.netAmount)} />
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                onClick={() => onOpenBoard(board.id)}
                aria-label={`${board.title} 열기`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                열기
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => handleExport(board)}
                aria-label={`${board.title} 내보내기`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                내보내기
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={() => document.getElementById(getImportInputId(board.id))?.click()}
                aria-label={`${board.title} 가져오기`}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                가져오기
              </button>
              <input
                id={getImportInputId(board.id)}
                className="hidden"
                type="file"
                accept="application/json,.json"
                aria-label={`${board.title} 백업 파일 선택`}
                onChange={(event) => handleImport(board, event)}
              />
            </div>
          </article>
        ))}
      </section>

      {boardRows.length === 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
          등록된 자산관리 목록이 없습니다.
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function getImportInputId(boardId: string) {
  return `asset-board-import-${boardId}`;
}

function toSafeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "asset-board"
  );
}

function parseBackupFile(value: unknown): BoardBackupFile {
  if (!isRecord(value) || value.app !== BACKUP_APP_ID || value.version !== BACKUP_VERSION) {
    throw new Error("Invalid backup header");
  }

  if (!isAssetBoard(value.board) || !Array.isArray(value.entries)) {
    throw new Error("Invalid backup body");
  }

  const entries = value.entries.map((entry) => {
    if (!isFlowEntry(entry)) {
      throw new Error("Invalid flow entry");
    }

    return entry;
  });

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    board: value.board,
    entries,
  };
}

function isAssetBoard(value: unknown): value is AssetBoard {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.ownerName === "string" &&
    (typeof value.description === "undefined" || typeof value.description === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isFlowEntry(value: unknown): value is FlowEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isFlowPeriodType(value.periodType) &&
    typeof value.year === "number" &&
    (typeof value.quarter === "undefined" || typeof value.quarter === "number") &&
    isTransactionType(value.type) &&
    typeof value.category === "string" &&
    typeof value.totalAmount === "number" &&
    Array.isArray(value.subcategories) &&
    value.subcategories.every(isSubcategoryAmount) &&
    (typeof value.memo === "undefined" || typeof value.memo === "string") &&
    typeof value.updatedAt === "string"
  );
}

function isSubcategoryAmount(value: unknown): value is SubcategoryAmount {
  return isRecord(value) && typeof value.name === "string" && typeof value.amount === "number";
}

function isFlowPeriodType(value: unknown): value is FlowPeriodType {
  return value === "quarter" || value === "year";
}

function isTransactionType(value: unknown): value is TransactionType {
  return value === "income" || value === "expense";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
