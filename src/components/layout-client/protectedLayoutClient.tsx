"use client";
import React, { useEffect, useState } from "react";
import AppSidebar from "@/components/global/app-sidebar";
import UpperInfoBar from "@/components/global/upper-info-bar";
import MobileNavbar from "@/components/global/upper-info-bar/mobile-navbar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Agent } from "@/lib/constants/types";
import { useAgentStore } from "@/store/agentstore";

interface Props {
  user: any;
  children: React.ReactNode;
}

export default function ProtectedLayoutClient({ user, children }: Props) {
  const [loading, setLoading] = useState(true);
  const { agents, setAgents } = useAgentStore();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents);
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [setAgents]);

  return (
    <>
      <AppSidebar user={user} recentAgents={agents} loading = {loading}/>
      <SidebarInset>
        <UpperInfoBar />
        <MobileNavbar />
        <div className="p-10">{loading ? <p>Loading...</p> : children}</div>
      </SidebarInset>
    </>
  );
}
