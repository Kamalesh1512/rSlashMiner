import React, { Suspense } from 'react'
import LoginPage from './_components/login-page'

const Page = () => {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading login...</div>}>
      <LoginPage />
    </Suspense>
  )
}

export default Page