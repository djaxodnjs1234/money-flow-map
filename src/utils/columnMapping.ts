import type { ColumnMapping, TransactionField } from "../types/transaction";

const FIELD_ALIASES: Record<TransactionField, string[]> = {
  date: ["date", "거래일", "날짜", "일자", "승인일", "이용일"],
  type: ["type", "구분", "유형", "타입", "수입/지출", "입출금", "거래구분"],
  amount: ["amount", "금액", "거래금액", "이용금액", "결제금액", "입금", "출금"],
  category: ["category", "카테고리", "분류", "대분류"],
  description: ["description", "내용", "사용처", "거래처", "가맹점", "적요", "내역"],
  memo: ["memo", "메모", "비고", "노트"],
  source: ["source", "출처", "계좌", "카드", "자산", "결제수단"],
};

export const REQUIRED_FIELDS: TransactionField[] = ["date", "type", "amount", "category"];

export const OPTIONAL_FIELDS: TransactionField[] = ["description", "memo", "source"];

export const TRANSACTION_FIELDS: TransactionField[] = [
  "date",
  "type",
  "amount",
  "category",
  "description",
  "memo",
  "source",
];

export const FIELD_LABELS: Record<TransactionField, string> = {
  date: "거래일",
  type: "수입/지출",
  amount: "금액",
  category: "카테고리",
  description: "내용",
  memo: "메모",
  source: "출처",
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    normalized: normalizeHeader(header),
  }));

  return TRANSACTION_FIELDS.reduce<ColumnMapping>((mapping, field) => {
    const aliases = FIELD_ALIASES[field].map(normalizeHeader);
    const matched = normalizedHeaders.find(({ normalized }) => aliases.includes(normalized));

    if (matched) {
      mapping[field] = matched.raw;
    }

    return mapping;
  }, {});
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replaceAll(/\s|_|-/g, "");
}
