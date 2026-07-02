import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_FLOW_ENTRIES } from "../data/sampleFlowEntries";
import type { FlowEntry } from "../types/flow";

interface FlowEntriesState {
  entries: FlowEntry[];
  upsertEntry: (entry: FlowEntry) => void;
  deleteEntry: (id: string) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

export const useFlowEntriesStore = create<FlowEntriesState>()(
  persist(
    (set) => ({
      entries: SAMPLE_FLOW_ENTRIES,
      upsertEntry: (entry) =>
        set((state) => {
          const exists = state.entries.some((item) => item.id === entry.id);
          const entries = exists
            ? state.entries.map((item) => (item.id === entry.id ? entry : item))
            : [entry, ...state.entries];

          return { entries: sortEntries(entries) };
        }),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
      resetToSample: () => set({ entries: SAMPLE_FLOW_ENTRIES }),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "money-flow-period-entries",
      version: 1,
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
