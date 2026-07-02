import type {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "../constants/categories";

export type TransactionType = "income" | "expense";

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description?: string;
  memo?: string;
  source?: string;
}

export type PeriodType = "month" | "quarter" | "year";

export interface PeriodSelection {
  periodType: PeriodType;
  year: number;
  month: number;
  quarter: number;
}

export type TransactionField =
  | "date"
  | "type"
  | "amount"
  | "category"
  | "description"
  | "memo"
  | "source";

export type ColumnMapping = Partial<Record<TransactionField, string>>;
