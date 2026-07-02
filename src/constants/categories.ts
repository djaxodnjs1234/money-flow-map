export const EXPENSE_CATEGORIES = [
  "식비",
  "카페/간식",
  "술/유흥",
  "생활",
  "온라인쇼핑",
  "패션/쇼핑",
  "뷰티/미용",
  "교통",
  "경조/선물",
  "교육/학습",
  "금융",
  "문화/여가",
  "여행/숙박",
  "의료/건강",
  "주거/통신",
  "기타지출",
] as const;

export const INCOME_CATEGORIES = [
  "급여",
  "상여금",
  "사업수입",
  "아르바이트",
  "용돈",
  "금융수입",
  "보험금",
  "장학금",
  "부동산",
  "중고거래",
  "SNS",
  "앱테크",
  "더치페이",
  "기타수입",
] as const;

export const CATEGORY_LABELS = {
  income: "수입",
  expense: "지출",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  급여: "#65a30d",
  상여금: "#84cc16",
  사업수입: "#16a34a",
  아르바이트: "#22c55e",
  용돈: "#a3e635",
  금융수입: "#14b8a6",
  보험금: "#2dd4bf",
  장학금: "#0891b2",
  부동산: "#0f766e",
  중고거래: "#059669",
  SNS: "#10b981",
  앱테크: "#34d399",
  더치페이: "#6ee7b7",
  기타수입: "#64748b",
  총수입: "#12330d",
  총지출: "#2f7de1",
  잔액: "#0f9f8f",
  초과지출: "#dc5f45",
  식비: "#d97706",
  "카페/간식": "#b45309",
  "술/유흥": "#c2410c",
  생활: "#ea580c",
  온라인쇼핑: "#f97316",
  "패션/쇼핑": "#fb923c",
  "뷰티/미용": "#e11d48",
  교통: "#7c3aed",
  "경조/선물": "#be123c",
  "교육/학습": "#2563eb",
  금융: "#475569",
  "문화/여가": "#9333ea",
  "여행/숙박": "#0ea5e9",
  "의료/건강": "#10b981",
  "주거/통신": "#0f766e",
  기타지출: "#64748b",
};

export function isIncomeCategory(category: string): category is (typeof INCOME_CATEGORIES)[number] {
  return INCOME_CATEGORIES.includes(category as (typeof INCOME_CATEGORIES)[number]);
}

export function isExpenseCategory(category: string): category is (typeof EXPENSE_CATEGORIES)[number] {
  return EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number]);
}
