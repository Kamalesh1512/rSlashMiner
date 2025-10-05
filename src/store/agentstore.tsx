import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Agent } from "@/lib/constants/types"; // new cleaned type

type AgentStore = {
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgentById: (agentId: string, updatedFields: Partial<Agent>) => void;
  removeAgent: (agentId: string) => void;
  // refreshAgents: () => Promise<void>;
};

export const useAgentStore = create(
  persist<AgentStore>(
    (set, get) => ({
      agents: [],

      setAgents: (agents) => set({ agents }),
      addAgent: (agent) => set({ agents: [...get().agents, agent] }),
      updateAgentById: (agentId, updatedFields) => {
        const updatedAgents = get().agents.map((a) =>
          a.id === agentId ? { ...a, ...updatedFields } : a
        );
        set({ agents: updatedAgents });
      },
      removeAgent: (agentId) =>
        set({ agents: get().agents.filter((a) => a.id !== agentId) }),
    }),
    { name: "agents-storage" }
  )
);
