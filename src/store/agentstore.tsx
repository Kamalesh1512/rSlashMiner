import { create } from "zustand"
import {persist} from "zustand/middleware"
import { Agent } from "@/lib/constants/types"

type AgentStore = {
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  updateAgentById: (agentId: string, updatedFields: Partial<Agent>) => void
}

// Corrected store with proper typing for persist middleware
export const useAgentStore = create(
  persist<AgentStore>(
    (set,get) => ({
      agents: [],
      setAgents: (agents) => set({ agents }),
      updateAgentById: (agentId, updatedFields) => {
        const updatedAgents = get().agents.map((agent) =>
          agent.id === agentId ? { ...agent, ...updatedFields } : agent
        )
        set({ agents: updatedAgents })
      },
    }),
    {
      name: "agents-storage", // The key used in localStorage
      // storage: localStorage, // You can also use sessionStorage if you want the data to be cleared when the session ends
    }
  )
)