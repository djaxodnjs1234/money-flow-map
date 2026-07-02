import dayjs from "dayjs";
import {
  isExpenseCategory,
  isIncomeCategory,
} from "../constants/categories";
import type {
  ColumnMapping,
  Transaction,
  TransactionCategory,
  TransactionType,
} from "../types/transaction";

export interface NormalizeResult {
  transactions: Transaction[];
  errors: string[];
  warnings: string[];
}

type RawRow = Record<string, unknown>;

export function normalizeRows(rows: RawRow[], mapping: ColumnMapping): NormalizeResult {
  const transactions: Transaction[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let skippedTransferCount = 0;
  let skippedZeroAmountCount = 0;

  rows.forEach((row, index) => {
    const rowNo = index + 2;
    const date = normalizeDate(readMapped(row, mapping.date));
    const rawType = readMapped(row, mapping.type);
    const rawAmount = readMapped(row, mapping.amount);
    const type = normalizeType(rawType);
    const amount = normalizeAmount(rawAmount);
    const categoryText = normalizeText(readMapped(row, mapping.category));

    if (!type && isSkippedTransactionType(rawType)) {
      skippedTransferCount += 1;
      return;
    }

    if (amount <= 0 && isZeroAmount(rawAmount)) {
      skippedZeroAmountCount += 1;
      return;
    }

    if (!date) {
      errors.push(`${rowNo}행: 거래일을 확인할 수 없습니다.`);
    }

    if (!type) {
      errors.push(`${rowNo}행: 수입/지출 구분을 확인할 수 없습니다.`);
    }

    if (!amount || amount <= 0) {
      errors.push(`${rowNo}행: 금액이 올바른 양수여야 합니다.`);
    }

    if (!date || !type || !amount || amount <= 0) {
      return;
    }

    const category = normalizeCategory(categoryText, type);
    if (category !== categoryText) {
      warnings.push(`${rowNo}행: '${categoryText || "빈 카테고리"}'는 '${category}'로 가져왔습니다.`);
    }

    transactions.push({
      id: crypto.randomUUID(),
      date,
      type,
      amount,
      category,
      description: normalizeText(readMapped(row, mapping.description)),
      memo: normalizeText(readMapped(row, mapping.memo)),
      source: normalizeText(readMapped(row, mapping.source)) || "업로드",
    });
  });

  if (skippedTransferCount > 0) {
    warnings.unshift(
      `${skippedTransferCount.toLocaleString("ko-KR")}건의 이체/저축성 내역은 소비흐름에서 제외했습니다.`,
    );
  }

  if (skippedZeroAmountCount > 0) {
    warnings.unshift(
      `${skippedZeroAmountCount.toLocaleString("ko-KR")}건의 0원 내역은 제외했습니다.`,
    );
  }

  return { transactions, errors, warnings };
}

export function normalizeType(value: unknown): TransactionType | null {
  const text = normalizeText(value).toLowerCase();

  if (["income", "수입", "입금", "plus", "+", "in"].includes(text)) {
    return "income";
  }

  if (["expense", "지출", "출금", "minus", "-", "out"].includes(text)) {
    return "expense";
  }

  return null;
}

function isSkippedTransactionType(value: unknown) {
  const text = normalizeText(value).toLowerCase();
  return ["이체", "transfer", "저축", "카드대금", "내계좌이체"].includes(text);
}

export function normalizeAmount(value: unknown) {
  if (typeof value === "number") {
    return Math.abs(value);
  }

  const numberText = normalizeText(value).replaceAll(/[^\d.-]/g, "");
  const amount = Number(numberText);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return dayjs(value).format("YYYY-MM-DD");
  }

  if (typeof value === "number") {
    const parsed = dayjs("1899-12-30").add(value, "day");
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }

  const text = normalizeText(value).replaceAll(".", "-").replaceAll("/", "-");
  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

function normalizeCategory(text: string, type: TransactionType): TransactionCategory {
  if (type === "income") {
    return isIncomeCategory(text) ? text : "기타수입";
  }

  return isExpenseCategory(text) ? text : "기타지출";
}

function readMapped(row: RawRow, header?: string) {
  return header ? row[header] : undefined;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function isZeroAmount(value: unknown) {
  if (typeof value === "number") {
    return value === 0;
  }

  return normalizeText(value).replaceAll(/[^\d.-]/g, "") === "0";
}
