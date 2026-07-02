import type { TransactionCategory, TransactionType } from "./transaction";

export type FlowPeriodType = "quarter" | "year";

export interface FlowPeriodSelection {
  periodType: FlowPeriodType;
  year: number;
  quarter: number;
}

export interface SubcategoryAmount {
  name: string;
  amount: number;
}

export interface FlowEntry {
  id: string;
  periodType: FlowPeriodType;
  year: number;
  quarter?: number;
  type: TransactionType;
  category: TransactionCategory;
  totalAmount: number;
  subcategories: SubcategoryAmount[];
  memo?: string;
  updatedAt: string;
}
