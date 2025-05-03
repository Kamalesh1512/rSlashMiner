"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function SlackConnect() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/slack/status")
      .then(res => res.json())
      .then(data => setConnected(data.connected))
  }, [])

  if (connected === null) return <p>Checking Slack status...</p>

  return connected ? (
    <p className="text-green-600 text-sm">✅ Slack is connected</p>
  ) : (
    <Button
      variant="outline"
      onClick={() => {
        window.location.href = "/api/slack/start"
      }}
    >
      Connect Slack
    </Button>
  )
}
