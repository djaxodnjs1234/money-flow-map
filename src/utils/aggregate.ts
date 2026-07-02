import type { Transaction, TransactionType } from "../types/transaction";

export interface SummaryMetrics {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  spendingRate: number;
  transactionCount: number;
}

export function aggregateByCategory(
  transactions: Transaction[],
  type: TransactionType,
): Record<string, number> {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
      return acc;
    }, {});
}

export function getSummaryMetrics(transactions: Transaction[]): SummaryMetrics {
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    spendingRate: totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0,
    transactionCount: transactions.length,
  };
}

export function sortTotals(totals: Record<string, number>) {
  return Object.entries(totals).sort(([, amountA], [, amountB]) => amountB - amountA);
}
