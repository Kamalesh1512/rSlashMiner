"use client"
import type { ReactNode } from "react"

interface BackgroundGradientProps {
  children: ReactNode
  className?: string
}

export default function BackgroundGradient({ children, className = "" }: BackgroundGradientProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80 pointer-events-none" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  )
}
