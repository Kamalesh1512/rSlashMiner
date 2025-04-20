"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import FeedbackForm from "./feedback-form"

// Define the types of events that can trigger feedback
type FeedbackTriggerEvent =
  | { type: "agent_created"; agentId: string }
  | { type: "agent_run"; agentId: string; success: boolean }
  | { type: "general" }

// Track which events have already triggered feedback to avoid duplicate prompts
const triggeredEvents = new Set<string>()

export default function FeedbackTrigger() {
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<FeedbackTriggerEvent | null>(null)
  const pathname = usePathname()

  // Listen for custom events that trigger feedback
  useEffect(() => {
    const handleFeedbackTrigger = (event: CustomEvent<FeedbackTriggerEvent>) => {
      const data = event.detail

      // Create a unique key for this event to avoid duplicates
      let eventKey: string

      switch (data.type) {
        case "agent_created":
          eventKey = `agent_created_${data.agentId}`
          break
        case "agent_run":
          eventKey = `agent_run_${data.agentId}_${Date.now()}`
          break
        // case "feature_used":
        //   eventKey = `feature_${data.featureId}`
        //   break
        default:
          eventKey = `general_${Date.now()}`
      }

      // Check if we've already triggered feedback for this event
      if (triggeredEvents.has(eventKey)) {
        return
      }

      // For agent runs, only trigger feedback occasionally (e.g., every 5th run)
      if (data.type === "agent_run") {
        const runCount = Number.parseInt(localStorage.getItem(`agent_run_count_${data.agentId}`) || "0")
        const newCount = runCount + 1
        localStorage.setItem(`agent_run_count_${data.agentId}`, newCount.toString())

        // Only ask for feedback every 5 runs or if it was the first successful run
        if (newCount > 1 && newCount % 5 !== 0) {
          return
        }
      }

      // Don't show feedback form immediately - wait a moment
      setTimeout(() => {
        setCurrentEvent(data)
        setShowFeedback(true)

        // Mark this event as triggered
        triggeredEvents.add(eventKey)
      }, 1500)
    }

    // Register the event listener
    window.addEventListener("feedbackTrigger", handleFeedbackTrigger as EventListener)

    return () => {
      window.removeEventListener("feedbackTrigger", handleFeedbackTrigger as EventListener)
    }
  }, [])

  // Reset feedback state when navigating to a new page
  useEffect(() => {
    setShowFeedback(false)
  }, [pathname])

  // Handle closing the feedback form
  const handleClose = () => {
    setShowFeedback(false)
    setCurrentEvent(null)
  }

  if (!currentEvent) return null

  return (
    <FeedbackForm
      isOpen={showFeedback}
      onClose={handleClose}
      eventType={currentEvent.type}
      entityId={
        currentEvent.type === "agent_created" || currentEvent.type === "agent_run"
          ? currentEvent.agentId : undefined
      }
    />
  )
}
