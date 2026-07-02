import { useMemo, useState } from "react";
import { Edit3, Search, Trash2 } from "lucide-react";
import { CATEGORY_LABELS } from "../constants/categories";
import type { Transaction } from "../types/transaction";
import { formatKRW } from "../utils/format";

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return transactions.filter((tx) => {
      const matchesType = type === "all" || tx.type === type;
      const matchesQuery =
        !normalizedQuery ||
        [tx.date, tx.category, tx.description, tx.memo, tx.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesType && matchesQuery;
    });
  }, [query, transactions, type]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">거래내역</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredTransactions.length.toLocaleString("ko-KR")}건 표시 중
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-64 max-w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="검색"
            />
          </div>

          <select
            aria-label="거래 유형 필터"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
          >
            <option value="all">전체</option>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">구분</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">내용</th>
              <th className="px-4 py-3">메모</th>
              <th className="px-4 py-3">출처</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="text-slate-700 hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{tx.date}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                      tx.type === "income"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {CATEGORY_LABELS[tx.type]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  {formatKRW(tx.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{tx.category}</td>
                <td className="max-w-64 truncate px-4 py-3">{tx.description}</td>
                <td className="max-w-64 truncate px-4 py-3">{tx.memo}</td>
                <td className="max-w-40 truncate px-4 py-3">{tx.source}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-white hover:text-river"
                    onClick={() => onEdit(tx)}
                    aria-label={`${tx.description ?? tx.category} 수정`}
                  >
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-white hover:text-coral"
                    onClick={() => onDelete(tx.id)}
                    aria-label={`${tx.description ?? tx.category} 삭제`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="p-8 text-center text-sm text-slate-500">
          조건에 맞는 거래내역이 없습니다.
        </div>
      )}
    </section>
  );
}
