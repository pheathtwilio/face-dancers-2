'use client'
import { useEffect, useRef } from 'react'
import PhoneVerification from './verify/page'
import ConfigService from '@/services/config-service'

export default function Home() {

  const configServiceRef = useRef<typeof ConfigService | null>(null)

  // Global Mounting    
  useEffect(() => {
    initialize()
  }, [])

  const initialize = () => {
    configServiceRef.current = ConfigService 
  }

  return (
    <PhoneVerification/>
  )
}
