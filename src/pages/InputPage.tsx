import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CalendarRange, Edit3, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  INCOME_PARENT_CATEGORY,
} from "../constants/categories";
import { getSubcategoryOptions } from "../constants/subcategories";
import { useFlowEntriesStore } from "../store/flowEntriesStore";
import type { AssetBoard } from "../types/assetBoard";
import type { FlowEntry, FlowPeriodSelection, SubcategoryAmount } from "../types/flow";
import type { TransactionCategory, TransactionType } from "../types/transaction";
import { filterFlowEntriesByPeriod, getFlowPeriodLabel } from "../utils/flowAggregate";
import { formatCompactKRW, formatKRW } from "../utils/format";

interface InputPageProps {
  board: AssetBoard;
}

export default function InputPage({ board }: InputPageProps) {
  const { entries, upsertEntry, deleteEntry, resetToSample, clearAll } = useFlowEntriesStore();
  const [editingEntry, setEditingEntry] = useState<FlowEntry | null>(null);
  const formAnchorRef = useRef<HTMLDivElement>(null);

  const visibleEntries = useMemo(
    () => filterFlowEntriesByPeriod(entries, board.period),
    [board.period, entries],
  );

  function handleSubmit(entry: FlowEntry) {
    upsertEntry(entry);
    setEditingEntry(null);
  }

  function startEdit(entry: FlowEntry) {
    setEditingEntry(entry);
    window.requestAnimationFrame(() => {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-river">{board.title}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
            분기·연도별 카테고리 입력
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
            onClick={() => resetToSample(board.period)}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            샘플 복원
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-soft transition hover:bg-red-50"
            onClick={clearAll}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            전체 삭제
          </button>
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-ink shadow-soft">
        <CalendarRange className="h-5 w-5 text-river" aria-hidden="true" />
        입력 기간
        <span className="rounded-md bg-river/10 px-2 py-1 text-river">
          {getFlowPeriodLabel(board.period).replace(" 자금흐름", "")}
        </span>
      </section>

      <div ref={formAnchorRef}>
        <FlowEntryForm
          period={board.period}
          entries={entries}
          editingEntry={editingEntry}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingEntry(null)}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">입력된 대분류</h2>
            <p className="mt-1 text-sm text-slate-500">
              선택한 기간에 {visibleEntries.length.toLocaleString("ko-KR")}개 대분류가 저장되어 있습니다.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">기간</th>
                <th className="px-4 py-3">구분</th>
                <th className="px-4 py-3">대분류</th>
                <th className="px-4 py-3">총액</th>
                <th className="px-4 py-3">소분류</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleEntries.map((entry) => (
                <tr key={entry.id} className="text-slate-700 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {formatEntryPeriod(entry)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                        entry.type === "income"
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {CATEGORY_LABELS[entry.type]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                    {entry.category}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                    {formatKRW(entry.totalAmount)}
                  </td>
                  <td className="max-w-xl px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.subcategories.map((subcategory) => (
                        <span
                          key={`${entry.id}-${subcategory.name}`}
                          className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        >
                          {subcategory.name} {formatCompactKRW(subcategory.amount)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-white hover:text-river"
                      onClick={() => startEdit(entry)}
                      aria-label={`${entry.category} 수정`}
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-white hover:text-coral"
                      onClick={() => deleteEntry(entry.id)}
                      aria-label={`${entry.category} 삭제`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleEntries.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            선택한 기간에 입력된 대분류가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}

interface FlowEntryFormProps {
  period: FlowPeriodSelection;
  entries: FlowEntry[];
  editingEntry: FlowEntry | null;
  onSubmit: (entry: FlowEntry) => void;
  onCancelEdit: () => void;
}

function FlowEntryForm({ period, entries, editingEntry, onSubmit, onCancelEdit }: FlowEntryFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>(EXPENSE_CATEGORIES[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [subcategoryAmounts, setSubcategoryAmounts] = useState<Record<string, string>>({});
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);
  const [customSubcategoryName, setCustomSubcategoryName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const categories = type === "income" ? [INCOME_PARENT_CATEGORY] : EXPENSE_CATEGORIES;
  const subcategoryOptions = useMemo(() => {
    const savedSubcategories = entries
      .filter((entry) => entry.type === type && entry.category === category)
      .flatMap((entry) => entry.subcategories.map((subcategory) => subcategory.name));

    return Array.from(
      new Set([...getSubcategoryOptions(category), ...savedSubcategories, ...customSubcategories]),
    );
  }, [category, customSubcategories, entries, type]);
  const numericTotal = parseAmount(totalAmount);
  const selectedTotal = selectedSubcategories.reduce(
    (sum, name) => sum + parseAmount(subcategoryAmounts[name]),
    0,
  );
  const remaining = Math.max(0, numericTotal - selectedTotal);

  useEffect(() => {
    if (!editingEntry) return;
    const formCategory = getFormCategory(editingEntry);
    const formSubcategories = getFormSubcategories(editingEntry);
    const baseOptions = getSubcategoryOptions(formCategory);

    setType(editingEntry.type);
    setCategory(formCategory);
    setTotalAmount(formatAmountInput(String(editingEntry.totalAmount)));
    setSelectedSubcategories(formSubcategories.map((item) => item.name));
    setSubcategoryAmounts(
      Object.fromEntries(
        formSubcategories.map((item) => [item.name, formatAmountInput(String(item.amount))]),
      ),
    );
    setCustomSubcategories(
      formSubcategories
        .map((item) => item.name)
        .filter((name) => !baseOptions.includes(name)),
    );
    setCustomSubcategoryName("");
    setMemo(editingEntry.memo ?? "");
    setError("");
  }, [editingEntry]);

  function handleTypeChange(nextType: TransactionType) {
    const nextCategory = nextType === "income" ? INCOME_PARENT_CATEGORY : EXPENSE_CATEGORIES[0];
    setType(nextType);
    setCategory(nextCategory);
    resetSubcategories();
  }

  function handleCategoryChange(nextCategory: TransactionCategory) {
    setCategory(nextCategory);
    resetSubcategories();
  }

  function toggleSubcategory(name: string) {
    setSelectedSubcategories((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function applyRemaining(name: string) {
    if (remaining <= 0) return;
    setSubcategoryAmounts((current) => ({
      ...current,
      [name]: formatAmountInput(String(parseAmount(current[name]) + remaining)),
    }));
    setSelectedSubcategories((current) => (current.includes(name) ? current : [...current, name]));
  }

  function splitEvenly() {
    if (numericTotal <= 0 || selectedSubcategories.length === 0) return;
    const base = Math.floor(numericTotal / selectedSubcategories.length);
    const last = numericTotal - base * (selectedSubcategories.length - 1);

    setSubcategoryAmounts(
      Object.fromEntries(
        selectedSubcategories.map((name, index) => [
          name,
          formatAmountInput(String(index === selectedSubcategories.length - 1 ? last : base)),
        ]),
      ),
    );
  }

  function resetSubcategories() {
    setSelectedSubcategories([]);
    setSubcategoryAmounts({});
    setCustomSubcategories([]);
    setCustomSubcategoryName("");
    setError("");
  }

  function addCustomSubcategory() {
    const name = customSubcategoryName.trim();

    if (!name) {
      setError("추가할 소분류 이름을 입력해주세요.");
      return;
    }

    if (!subcategoryOptions.includes(name)) {
      setCustomSubcategories((current) => [...current, name]);
    }

    setSelectedSubcategories((current) => (current.includes(name) ? current : [...current, name]));
    setSubcategoryAmounts((current) => ({
      ...current,
      [name]: current[name] ?? "",
    }));
    setCustomSubcategoryName("");
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (numericTotal <= 0) {
      setError("대분류 총액을 먼저 입력해주세요.");
      return;
    }

    if (selectedTotal > numericTotal) {
      setError("소분류 금액 합계가 대분류 총액보다 큽니다.");
      return;
    }

    const normalizedSubcategories = normalizeSubcategories(
      selectedSubcategories.map((name) => ({
        name,
        amount: parseAmount(subcategoryAmounts[name]),
      })),
      numericTotal,
      "미분류",
    );

    onSubmit({
      id: editingEntry?.id ?? crypto.randomUUID(),
      periodType: period.periodType,
      year: period.year,
      quarter: period.periodType === "quarter" ? period.quarter : undefined,
      type,
      category: type === "income" ? INCOME_PARENT_CATEGORY : category,
      totalAmount: numericTotal,
      subcategories: normalizedSubcategories,
      memo,
      updatedAt: new Date().toISOString(),
    });

    if (!editingEntry) {
      setTotalAmount("");
      setSelectedSubcategories([]);
      setSubcategoryAmounts({});
      setMemo("");
    }

    setError("");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {editingEntry ? "대분류 입력 수정" : "대분류 금액 입력"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            대분류 총액을 먼저 입력한 뒤 필요한 소분류를 선택해 금액을 배분합니다.
          </p>
        </div>
        {editingEntry && (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            onClick={onCancelEdit}
            aria-label="수정 취소"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-600">
            구분
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
            >
              <option value="expense">지출</option>
              <option value="income">수입</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-600">
            대분류
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value as TransactionCategory)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-600">
            대분류 총액
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
              inputMode="numeric"
              type="text"
              value={totalAmount}
              onChange={(event) => setTotalAmount(formatAmountInput(event.target.value))}
              placeholder="예: 960,000"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-600">
            메모
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="선택 입력"
            />
          </label>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">소분류 선택</h3>
              <p className="mt-1 text-sm text-slate-500">
                합계 {formatKRW(selectedTotal)} · 남은 금액 {formatKRW(remaining)}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              onClick={splitEvenly}
              disabled={selectedSubcategories.length === 0 || numericTotal <= 0}
            >
              균등 배분
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 md:flex-row md:items-end">
            <label className="min-w-0 flex-1 text-sm font-medium text-slate-600">
              소분류 추가
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
                value={customSubcategoryName}
                onChange={(event) => setCustomSubcategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomSubcategory();
                  }
                }}
                placeholder="예: 커피머신"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={addCustomSubcategory}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              추가
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subcategoryOptions.map((name) => {
              const selected = selectedSubcategories.includes(name);

              return (
                <div
                  key={name}
                  className={`rounded-md border bg-white p-3 transition ${
                    selected ? "border-river ring-2 ring-river/10" : "border-slate-200"
                  }`}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <input
                      className="h-4 w-4 accent-river"
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSubcategory(name)}
                    />
                    {name}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-river focus:ring-2 focus:ring-river/20 disabled:bg-slate-100"
                      type="text"
                      inputMode="numeric"
                      disabled={!selected}
                      value={subcategoryAmounts[name] ?? ""}
                      onChange={(event) =>
                        setSubcategoryAmounts((current) => ({
                          ...current,
                          [name]: formatAmountInput(event.target.value),
                        }))
                      }
                      placeholder="금액"
                    />
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      disabled={remaining <= 0}
                      onClick={() => applyRemaining(name)}
                    >
                      잔액
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
          {editingEntry ? "수정 저장" : "입력 저장"}
        </button>
      </form>
    </section>
  );
}

function getFormCategory(entry: FlowEntry): TransactionCategory {
  return entry.type === "income" ? INCOME_PARENT_CATEGORY : entry.category;
}

function getFormSubcategories(entry: FlowEntry): SubcategoryAmount[] {
  if (entry.type === "income" && entry.category !== INCOME_PARENT_CATEGORY) {
    return [{ name: entry.category, amount: entry.totalAmount }];
  }

  return entry.subcategories;
}

function parseAmount(value?: string) {
  const amount = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function formatAmountInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

function normalizeSubcategories(
  items: SubcategoryAmount[],
  totalAmount: number,
  fallbackName: string,
) {
  const positiveItems = items.filter((item) => item.amount > 0);
  const subTotal = positiveItems.reduce((sum, item) => sum + item.amount, 0);
  const remainder = totalAmount - subTotal;
  const fallback = fallbackName || "미분류";

  if (positiveItems.length === 0) {
    return [{ name: fallback, amount: totalAmount }];
  }

  if (remainder > 0) {
    const existing = positiveItems.find((item) => item.name === "미분류");
    if (existing) {
      existing.amount += remainder;
    } else {
      positiveItems.push({ name: "미분류", amount: remainder });
    }
  }

  return positiveItems.sort((itemA, itemB) => {
    if (itemB.amount !== itemA.amount) return itemB.amount - itemA.amount;
    return itemA.name.localeCompare(itemB.name, "ko-KR");
  });
}

function formatEntryPeriod(entry: Pick<FlowEntry, "periodType" | "year" | "quarter">) {
  if (entry.periodType === "quarter") {
    return `${entry.year}년 ${entry.quarter}분기`;
  }

  return `${entry.year}년`;
}
