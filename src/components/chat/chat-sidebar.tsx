"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Hash, MessageSquare, Settings, LogOut, Trash2, Slash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { signOut, useSession } from "next-auth/react"

type ChatHistory = {
  id: string
  title: string
  date: Date
}

export default function ChatSidebar() {
  const router = useRouter()
  const { data: session } = useSession()
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    { id: "1", title: "Reddit trends in tech industry", date: new Date(2023, 3, 15) },
    { id: "2", title: "Market research for startup", date: new Date(2023, 3, 14) },
    { id: "3", title: "Competitor analysis on r/SaaS", date: new Date(2023, 3, 12) },
    { id: "4", title: "Product feedback from users", date: new Date(2023, 3, 10) },
    { id: "5", title: "Content ideas for marketing", date: new Date(2023, 3, 8) },
  ])

  const handleNewChat = () => {
    router.push("/chat")
  }

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setChatHistory(chatHistory.filter((chat) => chat.id !== id))
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-full flex-col bg-muted/30 p-4">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-black">
          <Slash className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold">rSlashMiner</span>
      </div>

      <div className="mt-6">
        <Button onClick={handleNewChat} className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="mt-6">
        <h3 className="px-2 text-sm font-medium text-muted-foreground">Recent Chats</h3>
        <ScrollArea className="h-[calc(100vh-15rem)] pr-2">
          <div className="mt-2 space-y-1">
            {chatHistory.map((chat) => (
              <motion.div key={chat.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/chat/${chat.id}`}
                  className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{formatDate(chat.date)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto">
        <Separator className="my-4" />
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted">
              {session?.user?.image ? (
                <img
                  src={session.user.image || "/placeholder.svg"}
                  alt={session.user.name || "User"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email || ""}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

