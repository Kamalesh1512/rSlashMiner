"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { LayoutDashboard, Bot, Search, Bell, Settings, HelpCircle, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "@/lib/constants/types"

const MobileNavbar = () => {
  const pathname = usePathname()
  const { isMobile} = useSidebar()

  // Only show on mobile when sidebar is collapsed
  const isVisible = isMobile
  if (!isVisible) return null

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex px-4 py-2 space-x-2 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileNavbar
