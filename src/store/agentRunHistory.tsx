// store/agentRunHistoryStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type StepStatus = "running" | "completed" | "error" | "waiting" | "skipped";
export interface Step {
  id: string;
  status: StepStatus;
  message?: string;
  details?: string;
  timestamp: Date; // ISO string
  progress?: number;
  subreddit?: string;
}

export interface RunHistoryItem {
  id: string; // unique run id
  agentId: string;
  startedAt: Date; // ISO string
  completedAt?: Date;
  success?: boolean;
  summary?: string;
  resultsCount?: number;
  processedKeywords?: number;
  error?: string;
  steps: Step[];
}

interface AgentRunHistoryState {
  runHistory: RunHistoryItem[];
  addHistoryItem: (item: RunHistoryItem) => void;
  updateHistoryItem: (id: string, updates: Partial<RunHistoryItem>) => void;
  clearHistory: () => void;
}

export const useAgentRunHistoryStore = create<AgentRunHistoryState>()(
  persist(
    (set, get) => ({
      runHistory: [],

      addHistoryItem: (item) =>
        set((state) => ({
          runHistory: [item, ...state.runHistory],
        })),

      updateHistoryItem: (id, updates) =>
        set((state) => ({
          runHistory: state.runHistory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      clearHistory: () => set({ runHistory: [] }),
    }),
    {
      name: "agent-run-history", // key in localStorage
      partialize: (state) => ({ runHistory: state.runHistory }), // only persist runHistory
    }
  )
);
