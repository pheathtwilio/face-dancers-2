'use client'
import { useEffect } from 'react'
import PhoneVerification from './verify/page'
import Interstitial from './interstitial/page'
import { logInfo } from '@/services/logger-service'

export default function Home() {
  // Determine if session checking is disabled
  const sessionCheckingDisabled =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_LOCAL_LOGGING === 'true'

  useEffect(() => {
    if (sessionCheckingDisabled) {
      logInfo('Main Page SessionChecking is disabled')
    } else {
      logInfo('Main page Session Checking is Enabled')
    }
  }, [sessionCheckingDisabled])

  // Conditionally render components based on the flag
  return sessionCheckingDisabled ? <Interstitial /> : <PhoneVerification />
}
