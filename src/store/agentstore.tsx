import { create } from "zustand"
import {persist} from "zustand/middleware"
import { Agent } from "@/lib/constants/constants"

type AgentStore = {
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
}

// Corrected store with proper typing for persist middleware
export const useAgentStore = create(
  persist<AgentStore>(
    (set) => ({
      agents: [],
      setAgents: (agents) => set({ agents }),
    }),
    {
      name: "agents-storage", // The key used in localStorage
      // storage: localStorage, // You can also use sessionStorage if you want the data to be cleared when the session ends
    }
  )
)