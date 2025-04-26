"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { getSession, signIn, useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { SubscriptionCard } from "@/components/payments/subscription-card"
import { SubscriptionManagement } from "@/components/payments/subscription-management"
import { getMonthlyPlans, getYearlyPlans } from "@/lib/payments/subscription-plans"

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)

  // Get plans
  const monthlyPlans = getMonthlyPlans()
  const yearlyPlans = getYearlyPlans()

  useEffect(() => {
    // Check for success or canceled params
    const success = searchParams.get("active")
    const canceled = searchParams.get("canceled")

    const refreshSession = async () => {
      // Force re-authentication to refresh session (optional: redirect=false)
      await signIn("credentials", { redirect: false })
      await getSession() // optional: fetch updated session data
    }

    if (success === "true") {
      setShowSuccess(true)

      // Clear the URL params after a delay
      setTimeout(() => {
        router.replace("/settings")
      }, 5000)
    }

    if (canceled === "true") {
      setShowCanceled(true)

        // Refresh session to reflect new subscription tier
        refreshSession()

      // Clear the URL params after a delay
      setTimeout(() => {
        router.replace("/settings")
      }, 5000)
    }

    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      setIsLoading(false)
    }
  }, [status, router, searchParams])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing.</p>
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Payment successful!</h3>
            </div>
            <p className="text-sm mt-1">Thank you for your payment. Your subscription has been updated successfully.</p>
          </motion.div>
        )}

        {showCanceled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="font-medium">Payment cancelled</h3>
            </div>
            <p className="text-sm mt-1">Your payment was canceled. No changes have been made to your subscription.</p>
          </motion.div>
        )}

        <div className="space-y-8">
          <SubscriptionManagement />

          {/* Subscription plans details */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>

            <Tabs defaultValue="monthly" onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}>
              <div className="flex justify-center mb-8">
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="annual">Annual (Save 15%)</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="monthly">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {monthlyPlans.map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={
                        session?.user?.subscriptionTier ===
                        (plan.id === "pro_monthly" ? "pro" : plan.id === "business_monthly" ? "premium" : "free")
                      }
                      showYearlySavings={true}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="annual">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {yearlyPlans.map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={
                        session?.user?.subscriptionTier ===
                        (plan.id === "pro_yearly" ? "pro" : plan.id === "business_yearly" ? "premium" : "free")
                      }
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
