import {
  EXPENSE_CATEGORIES,
  INCOME_PARENT_CATEGORY,
  INCOME_SOURCE_CATEGORIES,
} from "./categories";
import type { TransactionCategory } from "../types/transaction";

export const INCOME_SUBCATEGORIES: Record<string, readonly string[]> = {
  [INCOME_PARENT_CATEGORY]: INCOME_SOURCE_CATEGORIES,
  ...Object.fromEntries(
    INCOME_SOURCE_CATEGORIES.map((category) => [category, ["미분류"] as const]),
  ),
};

export const EXPENSE_SUBCATEGORIES: Record<string, readonly string[]> = {
  "경조/선물": ["선물"],
  "교육/학습": ["시험료", "학교", "학원/강의"],
  교통: ["대중교통", "시외버스", "철도", "택시"],
  금융: ["세금/과태료", "은행", "이자/대출", "증권/투자", "카드"],
  "문화/여가": ["게임", "도서", "미분류", "스포츠", "영화", "전시/관람", "취미/체험", "헬스"],
  "뷰티/미용": ["미용용품", "헤어샵", "화장품"],
  생활: ["마트", "생필품", "세탁", "편의점"],
  "술/유흥": ["맥주/호프", "와인", "요리주점"],
  식비: ["고기", "배달", "뷔페", "식재료", "아시아음식", "일식", "치킨", "패스트푸드", "한식"],
  "여행/숙박": ["관광", "여행"],
  온라인쇼핑: ["결제/충전", "서비스구독", "앱스토어", "인터넷쇼핑"],
  "의료/건강": ["기타병원", "약국"],
  "주거/통신": ["관리비", "전기세", "휴대폰"],
  "카페/간식": ["디저트/떡", "베이커리", "아이스크림/빙수", "커피/음료"],
  "패션/쇼핑": ["스포츠의류", "패션"],
  기타지출: ["미분류"],
};

export const SUBCATEGORY_OPTIONS: Record<string, readonly string[]> = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, ["미분류"] as const])),
  ...INCOME_SUBCATEGORIES,
  ...EXPENSE_SUBCATEGORIES,
};

export function getSubcategoryOptions(category: TransactionCategory) {
  return SUBCATEGORY_OPTIONS[category] ?? ["미분류"];
}
