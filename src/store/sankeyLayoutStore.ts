import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SankeyLayoutPositions } from "../components/SankeyChart";

export type SankeyLayoutMode = "basic" | "detailed";

interface BoardSankeyLayouts {
  basic?: SankeyLayoutPositions;
  detailed?: SankeyLayoutPositions;
}

interface SankeyLayoutState {
  layoutsByBoardId: Record<string, BoardSankeyLayouts>;
  setLayout: (boardId: string, mode: SankeyLayoutMode, positions: SankeyLayoutPositions) => void;
}

export const useSankeyLayoutStore = create<SankeyLayoutState>()(
  persist(
    (set) => ({
      layoutsByBoardId: {},
      setLayout: (boardId, mode, positions) =>
        set((state) => ({
          layoutsByBoardId: {
            ...state.layoutsByBoardId,
            [boardId]: {
              ...state.layoutsByBoardId[boardId],
              [mode]: positions,
            },
          },
        })),
    }),
    {
      name: "money-flow-sankey-layouts",
      version: 1,
    },
  ),
);
