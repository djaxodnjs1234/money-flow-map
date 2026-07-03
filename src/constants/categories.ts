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

export const INCOME_PARENT_CATEGORY = "수입" as const;

export const INCOME_SOURCE_CATEGORIES = [
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

export const INCOME_CATEGORIES = [
  INCOME_PARENT_CATEGORY,
  ...INCOME_SOURCE_CATEGORIES,
] as const;

export const CATEGORY_LABELS = {
  income: "수입",
  expense: "지출",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  수입: "#0f766e",
  급여: "#65a30d",
  상여금: "#f59e0b",
  사업수입: "#8b5cf6",
  아르바이트: "#06b6d4",
  용돈: "#a3e635",
  금융수입: "#14b8a6",
  보험금: "#ef4444",
  장학금: "#0891b2",
  부동산: "#a16207",
  중고거래: "#db2777",
  SNS: "#7c3aed",
  앱테크: "#f97316",
  더치페이: "#0d9488",
  기타수입: "#64748b",
  총수입: "#12330d",
  총지출: "#2f7de1",
  순이익: "#0f9f8f",
  초과지출: "#dc5f45",
  식비: "#e11d48",
  "카페/간식": "#b45309",
  "술/유흥": "#7c2d12",
  생활: "#0ea5e9",
  온라인쇼핑: "#f97316",
  "패션/쇼핑": "#db2777",
  "뷰티/미용": "#a855f7",
  교통: "#2563eb",
  "경조/선물": "#be123c",
  "교육/학습": "#4f46e5",
  금융: "#475569",
  "문화/여가": "#9333ea",
  "여행/숙박": "#06b6d4",
  "의료/건강": "#10b981",
  "주거/통신": "#0f766e",
  기타지출: "#78716c",
};

export function isIncomeCategory(category: string): category is (typeof INCOME_CATEGORIES)[number] {
  return INCOME_CATEGORIES.includes(category as (typeof INCOME_CATEGORIES)[number]);
}

export function isExpenseCategory(category: string): category is (typeof EXPENSE_CATEGORIES)[number] {
  return EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number]);
}
