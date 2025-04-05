import { auth } from '@/lib/auth'
import { checkAgentCreationLimit } from '@/lib/check-subscriptions/subscriptions'
import React from 'react'
import CreateAgentPage from './_components/create-agent'

const page = async () => {
  //agent create main page

  const session = await auth()

  if (!session?.user) {
    return <div>Unauthorised</div>
  }

  const result =await checkAgentCreationLimit(session?.user.id)
  return (
    <div>
      <CreateAgentPage creationLimit={result}/>
    </div>
  )
}

export default page