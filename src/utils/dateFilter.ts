import dayjs from "dayjs";
import type { PeriodSelection, PeriodType, Transaction } from "../types/transaction";

export function getPeriodBounds(
  periodType: PeriodType,
  year: number,
  month = 1,
  quarter = 1,
) {
  if (periodType === "month") {
    const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    return { start, end: start.add(1, "month") };
  }

  if (periodType === "quarter") {
    const startMonth = (quarter - 1) * 3 + 1;
    const start = dayjs(`${year}-${String(startMonth).padStart(2, "0")}-01`);
    return { start, end: start.add(3, "month") };
  }

  const start = dayjs(`${year}-01-01`);
  return { start, end: start.add(1, "year") };
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  periodType: PeriodType,
  year: number,
  month?: number,
  quarter?: number,
): Transaction[] {
  const { start, end } = getPeriodBounds(periodType, year, month, quarter);

  return transactions.filter((tx) => {
    const date = dayjs(tx.date);
    return date.isValid() && !date.isBefore(start) && date.isBefore(end);
  });
}

export function filterByPeriodSelection(
  transactions: Transaction[],
  selection: PeriodSelection,
) {
  return filterTransactionsByPeriod(
    transactions,
    selection.periodType,
    selection.year,
    selection.month,
    selection.quarter,
  );
}

export function getPeriodLabel(selection: PeriodSelection) {
  if (selection.periodType === "month") {
    return `${selection.year}년 ${selection.month}월 소비흐름`;
  }

  if (selection.periodType === "quarter") {
    return `${selection.year}년 ${selection.quarter}분기 소비흐름`;
  }

  return `${selection.year}년 전체 소비흐름`;
}

export function getAvailableYears(transactions: Transaction[]) {
  const years = new Set<number>();

  transactions.forEach((tx) => {
    const year = dayjs(tx.date).year();
    if (Number.isFinite(year)) {
      years.add(year);
    }
  });

  return [...years].sort((a, b) => b - a);
}
