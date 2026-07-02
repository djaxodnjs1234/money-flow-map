import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../constants/categories";
import type { Transaction, TransactionType } from "../types/transaction";

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onSubmit: (transaction: Transaction) => void;
  onCancelEdit?: () => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function TransactionForm({
  editingTransaction,
  onSubmit,
  onCancelEdit,
}: TransactionFormProps) {
  const [date, setDate] = useState(today);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [memo, setMemo] = useState("");
  const [source, setSource] = useState("수동 입력");

  useEffect(() => {
    if (!editingTransaction) return;

    setDate(editingTransaction.date);
    setType(editingTransaction.type);
    setAmount(String(editingTransaction.amount));
    setCategory(editingTransaction.category);
    setDescription(editingTransaction.description ?? "");
    setMemo(editingTransaction.memo ?? "");
    setSource(editingTransaction.source ?? "수동 입력");
  }, [editingTransaction]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategory(nextType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!date || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    onSubmit({
      id: editingTransaction?.id ?? crypto.randomUUID(),
      date,
      type,
      amount: numericAmount,
      category: category as Transaction["category"],
      description,
      memo,
      source,
    });

    if (!editingTransaction) {
      setAmount("");
      setDescription("");
      setMemo("");
      setSource("수동 입력");
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          {editingTransaction ? "거래 수정" : "거래 수동 입력"}
        </h2>
        {editingTransaction && (
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

      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-600">
          거래일
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

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
          금액
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            inputMode="numeric"
            min={1}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          카테고리
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-600 md:col-span-2">
          내용
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="사용처 또는 수입 내용"
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          출처
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-600">
          메모
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>

        <div className="flex items-end md:col-span-2 xl:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {editingTransaction ? "수정 저장" : "거래 추가"}
          </button>
        </div>
      </form>
    </section>
  );
}
