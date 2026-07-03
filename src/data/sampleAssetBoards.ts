import type { AssetBoard } from "../types/assetBoard";

export const DEFAULT_BOARD_ID = "hong-gildong-assets";

export const SAMPLE_ASSET_BOARDS: AssetBoard[] = [
  {
    id: DEFAULT_BOARD_ID,
    title: "홍길동의 자산관리",
    ownerName: "홍길동",
    period: {
      periodType: "quarter",
      year: 2026,
      quarter: 3,
    },
    description: "분기별·연도별 자금흐름을 공개 목록에서 확인합니다.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];
