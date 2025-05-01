
import RecentDetails from "./_components/recents-details"
import { checkAgentCreationLimit } from "@/lib/payments/check-subscriptions/subscriptions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubscriptionManagement } from "@/components/payments/subscription-management"



export default async function DashboardPage() {

  const session = await auth()

  if (!session?.user) {
    return <div>Unauthorised</div>
  }
  
  const result = await checkAgentCreationLimit(session?.user.id)
  

  return (
    <div className="space-y-5">
      <RecentDetails/>
      <SubscriptionManagement/>
    </div>
  )
}
