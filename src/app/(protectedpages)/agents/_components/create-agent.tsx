"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import AgentCreationForm from "@/components/agents/agent-creation-form"


interface CreateAgentProps{
    creationLimit:{
        canCreate:boolean
        used: number,
        limit:number
        tier:string,
        monitoringRequests:number
    }
}

export default function CreateAgentPage({creationLimit}:CreateAgentProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [canCreateAgent, setCanCreateAgent] = useState(true)
  const [limitInfo, setLimitInfo] = useState<{
    used: number
    limit: number
    tier: string
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated" && session?.user?.id) {
      const checkLimit = async () => {
        try {
          const result = creationLimit
          setCanCreateAgent(result.canCreate)
          setLimitInfo(result)
        } catch (error) {
          toast.error("Error",{
            description: "Failed to check subscription limits",
          })
        } finally {
          setIsLoading(false)
        }
      }

      checkLimit()
    }

  }, [status, session, router, toast])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-normal p-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <p className="text-muted-foreground">
            Set up an AI agent to monitor Reddit for potential customers interested in your business.
          </p>
        </div>

        {!canCreateAgent ? (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Agent Creation Limit Reached</h2>
              <p>
                You have used {limitInfo?.used} out of {limitInfo?.limit} agent creation{" "}
                {limitInfo?.limit === 1 ? "slot" : "slots"} for your {limitInfo?.tier} subscription.
              </p>
              <div className="mt-6 space-y-4">
                <p>To create more agents, you can:</p>
                <ul className="list-disc list-inside text-left mx-auto max-w-md">
                  <li>Wait for your limit to reset</li>
                  <li>Upgrade your subscription plan</li>
                  <li>Delete an existing agent to free up a slot</li>
                </ul>
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="outline" onClick={() => router.push("/agents")}>
                    View My Agents
                  </Button>
                  <Button onClick={() => router.push("/pricing")}>Upgrade Plan</Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <AgentCreationForm userId={session?.user?.id || ""} />
        )}
      </motion.div>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { checkAgentCreationLimit } from "@/lib/check-subscriptions/subscriptions"

