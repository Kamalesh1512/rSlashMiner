'use client'

import * as React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, MessageSquare, Settings, User, ChevronDown } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// Types for our conversations
interface Conversation {
  id: string
  title: string
  date: string
}

interface ChatSidebarProps {
  activeChatId: string | null
  onChatSelect: (chatId: string) => void
}

export function ChatSidebar({ activeChatId, onChatSelect }: ChatSidebarProps) {
  // Mock conversation data
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'Getting started with AI', date: 'Today' },
    { id: '2', title: 'How to use embeddings', date: 'Yesterday' },
    { id: '3', title: 'Building a chatbot', date: 'Mar 10' },
    { id: '4', title: 'Language models explained', date: 'Mar 5' },
  ])

  // Function to create a new chat
  const createNewChat = () => {
    const newChat = {
      id: Math.random().toString(36).substring(7),
      title: 'New Chat',
      date: 'Today'
    }
    setConversations([newChat, ...conversations])
    onChatSelect(newChat.id)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar 
        collapsible="offcanvas" 
        variant="sidebar" 
        className="border-r border-border bg-sidebar dark"
      >
        <SidebarHeader className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <Button 
                onClick={createNewChat} 
                variant="outline" 
                className="flex w-full items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Plus className="size-4" />
                  New chat
                </span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations
                  .filter(c => c.date === 'Today')
                  .map(chat => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          isActive={chat.id === activeChatId}
                          onClick={() => onChatSelect(chat.id)}
                        >
                          <MessageSquare className="size-4 shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>Previous 7 days</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations
                  .filter(c => c.date === 'Yesterday' || c.date.startsWith('Mar'))
                  .map(chat => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton 
                        isActive={chat.id === activeChatId}
                        onClick={() => onChatSelect(chat.id)}
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="size-4 shrink-0" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User className="size-4 shrink-0" />
                <span>My Account</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-2" />
          <div className="px-3 py-2">
            <Button variant="ghost" className="flex items-center justify-start w-full gap-2 text-xs">
              <User className="size-4 shrink-0" />
              <span className="truncate">John Doe</span>
              <ChevronDown className="ml-auto size-3 shrink-0" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}