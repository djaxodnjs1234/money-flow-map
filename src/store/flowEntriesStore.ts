import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BOARD_ID } from "../data/sampleAssetBoards";
import { SAMPLE_FLOW_ENTRIES } from "../data/sampleFlowEntries";
import type { FlowEntry } from "../types/flow";

interface FlowEntriesState {
  activeBoardId: string;
  entries: FlowEntry[];
  entriesByBoardId: Record<string, FlowEntry[]>;
  setActiveBoardId: (boardId: string) => void;
  upsertEntry: (entry: FlowEntry) => void;
  deleteEntry: (id: string) => void;
  deleteBoardEntries: (boardId: string) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

export const useFlowEntriesStore = create<FlowEntriesState>()(
  persist(
    (set) => ({
      activeBoardId: DEFAULT_BOARD_ID,
      entries: SAMPLE_FLOW_ENTRIES,
      entriesByBoardId: {
        [DEFAULT_BOARD_ID]: SAMPLE_FLOW_ENTRIES,
      },
      setActiveBoardId: (boardId) =>
        set((state) => ({
          activeBoardId: boardId,
          entries: state.entriesByBoardId[boardId] ?? [],
        })),
      upsertEntry: (entry) =>
        set((state) => {
          const currentEntries = state.entriesByBoardId[state.activeBoardId] ?? [];
          const exists = currentEntries.some((item) => item.id === entry.id);
          const entries = sortEntries(
            exists
              ? currentEntries.map((item) => (item.id === entry.id ? entry : item))
              : [entry, ...currentEntries],
          );

          return {
            entries,
            entriesByBoardId: {
              ...state.entriesByBoardId,
              [state.activeBoardId]: entries,
            },
          };
        }),
      deleteEntry: (id) =>
        set((state) => {
          const entries = (state.entriesByBoardId[state.activeBoardId] ?? []).filter(
            (entry) => entry.id !== id,
          );

          return {
            entries,
            entriesByBoardId: {
              ...state.entriesByBoardId,
              [state.activeBoardId]: entries,
            },
          };
        }),
      deleteBoardEntries: (boardId) =>
        set((state) => {
          const entriesByBoardId = { ...state.entriesByBoardId };
          delete entriesByBoardId[boardId];
          const activeBoardId = state.activeBoardId === boardId ? DEFAULT_BOARD_ID : state.activeBoardId;

          return {
            activeBoardId,
            entriesByBoardId,
            entries: entriesByBoardId[activeBoardId] ?? [],
          };
        }),
      resetToSample: () =>
        set((state) => ({
          entries: SAMPLE_FLOW_ENTRIES,
          entriesByBoardId: {
            ...state.entriesByBoardId,
            [state.activeBoardId]: SAMPLE_FLOW_ENTRIES,
          },
        })),
      clearAll: () =>
        set((state) => ({
          entries: [],
          entriesByBoardId: {
            ...state.entriesByBoardId,
            [state.activeBoardId]: [],
          },
        })),
    }),
    {
      name: "money-flow-period-entries",
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<FlowEntriesState> | undefined;

        if (version < 2) {
          const entries = Array.isArray(state?.entries) ? state.entries : SAMPLE_FLOW_ENTRIES;

          return {
            activeBoardId: DEFAULT_BOARD_ID,
            entries,
            entriesByBoardId: {
              [DEFAULT_BOARD_ID]: entries,
            },
          };
        }

        const activeBoardId = state?.activeBoardId ?? DEFAULT_BOARD_ID;
        const entriesByBoardId = state?.entriesByBoardId ?? {
          [DEFAULT_BOARD_ID]: SAMPLE_FLOW_ENTRIES,
        };

        return {
          activeBoardId,
          entriesByBoardId,
          entries: entriesByBoardId[activeBoardId] ?? [],
        };
      },
    },
  ),
);

function sortEntries(entries: FlowEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.periodType !== a.periodType) return b.periodType.localeCompare(a.periodType);
    return (b.quarter ?? 0) - (a.quarter ?? 0);
  });
}
