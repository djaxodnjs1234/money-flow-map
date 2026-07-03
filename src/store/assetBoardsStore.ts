import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_ASSET_BOARDS } from "../data/sampleAssetBoards";
import type { AssetBoard } from "../types/assetBoard";

interface AssetBoardInput {
  title: string;
  ownerName: string;
  description?: string;
}

interface AssetBoardsState {
  boards: AssetBoard[];
  addBoard: (input: AssetBoardInput) => AssetBoard;
  updateBoard: (id: string, input: AssetBoardInput) => void;
  deleteBoard: (id: string) => void;
}

export const useAssetBoardsStore = create<AssetBoardsState>()(
  persist(
    (set) => ({
      boards: SAMPLE_ASSET_BOARDS,
      addBoard: (input) => {
        const now = new Date().toISOString();
        const board: AssetBoard = {
          id: createBoardId(input.title),
          title: input.title.trim(),
          ownerName: input.ownerName.trim(),
          description: input.description?.trim(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          boards: [board, ...state.boards],
        }));

        return board;
      },
      updateBoard: (id, input) =>
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === id
              ? {
                  ...board,
                  title: input.title.trim(),
                  ownerName: input.ownerName.trim(),
                  description: input.description?.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : board,
          ),
        })),
      deleteBoard: (id) =>
        set((state) => ({
          boards: state.boards.filter((board) => board.id !== id),
        })),
    }),
    {
      name: "money-flow-asset-boards",
      version: 1,
    },
  ),
);

function createBoardId(title: string) {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);

  return `${normalizedTitle || "asset-board"}-${crypto.randomUUID().slice(0, 8)}`;
}
