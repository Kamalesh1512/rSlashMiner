"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function FooterCta() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const route = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.body.scrollHeight

      // Show the footer CTA when user has scrolled 60% of the page
      if (scrollPosition > windowHeight * 0.6 && scrollPosition < documentHeight - windowHeight * 1.2) {
        setIsVisible(true)
        setHasScrolled(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 transition-all duration-300 z-40",
        isVisible ? "translate-y-0" : "translate-y-full",
        hasScrolled ? "shadow-lg" : "",
      )}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <p className="text-gray-700 mb-3 sm:mb-0">👋 Still thinking? Try Skroub free—see leads waiting for you.</p>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={()=>route.push('/signup')}>Start Free</Button>
      </div>
    </div>
  )
}
