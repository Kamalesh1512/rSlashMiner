"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import ChatSidebar from "@/components/chat/chat-sidebar"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on window resize (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-full">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for mobile (overlay) */}
      <div
        className={`fixed inset-0 z-40 transform bg-background/80 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto bg-background transition-all duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatSidebar />
      </div> */}

      {/* Sidebar for desktop (permanent) */}
      <div className="hidden w-72 overflow-y-auto border-r lg:block">
        <ChatSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

