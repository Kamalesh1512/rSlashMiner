import { auth } from '@/lib/auth'
import React from 'react'
import CreateAgentPage from '../_components/create-agent'
import { canCreateAgent, getUsageOverview } from '@/lib/payments/check-subscriptions/subscriptions'
import { planConfigType, usageLimitProps } from '@/lib/constants/types'

const page = async () => {
  //agent create main page

  const session = await auth()

  if (!session?.user) {
    return <div>Unauthorised</div>
  }

  const result =await canCreateAgent(session?.user.id)
  const usageOverview = await getUsageOverview(session.user.id)
  return (
    <div>
      <CreateAgentPage createAgent={result} usage={usageOverview}/>
    </div>
  )
}

export default page