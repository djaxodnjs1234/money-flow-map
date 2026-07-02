import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { useTransactionsStore } from "../store/transactionsStore";
import type { Transaction } from "../types/transaction";
import { toCsvCell } from "../utils/format";

export default function TransactionsPage() {
  const { transactions, upsertTransaction, deleteTransaction, clearAll } = useTransactionsStore();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  function handleSubmit(transaction: Transaction) {
    upsertTransaction(transaction);
    setEditingTransaction(null);
  }

  function exportCsv() {
    const headers = ["date", "type", "amount", "category", "description", "memo", "source"];
    const rows = transactions.map((tx) =>
      headers
        .map((header) => toCsvCell(tx[header as keyof Transaction]))
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "money-flow-transactions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-river">Transactions</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
            거래내역 관리
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
            onClick={exportCsv}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV 내보내기
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

      <TransactionForm
        editingTransaction={editingTransaction}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingTransaction(null)}
      />

      <TransactionTable
        transactions={transactions}
        onEdit={setEditingTransaction}
        onDelete={deleteTransaction}
      />
    </div>
  );
}
