import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_TRANSACTIONS } from "../data/sampleTransactions";
import type { Transaction } from "../types/transaction";

interface TransactionsState {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  upsertTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: SAMPLE_TRANSACTIONS,
      setTransactions: (transactions) => set({ transactions }),
      addTransactions: (transactions) =>
        set((state) => ({
          transactions: [...transactions, ...state.transactions].sort((a, b) =>
            b.date.localeCompare(a.date),
          ),
        })),
      upsertTransaction: (transaction) =>
        set((state) => {
          const exists = state.transactions.some((tx) => tx.id === transaction.id);
          const transactions = exists
            ? state.transactions.map((tx) => (tx.id === transaction.id ? transaction : tx))
            : [transaction, ...state.transactions];

          return {
            transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)),
          };
        }),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
      resetToSample: () => set({ transactions: SAMPLE_TRANSACTIONS }),
      clearAll: () => set({ transactions: [] }),
    }),
    {
      name: "money-flow-transactions",
      version: 1,
    },
  ),
);
