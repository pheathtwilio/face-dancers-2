'use client'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import EventService from '@/services/event-service'
import dynamic from 'next/dynamic'
import { useRef, useEffect } from 'react'
import AvatarEvents from '@/util/avatar-types'
import DeepgramService from '@/services/deepgram-service'
import LLMService from '@/services/llm-service'
import STTService from '@/services/speech-to-text-service'

const WaitingRoom = dynamic(() => import('../app/waiting-room/page'))

export default function Home() {

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)
  const deepgramServiceRef = useRef<typeof DeepgramService | null>(null)
  const llmServiceRef = useRef<typeof LLMService | null>(null)
  const sttServiceRef = useRef<typeof STTService | null>(null)

  // Global Mounting    
  useEffect(() => {

    // this initializes all of these singleton classes
    try {
      avatarServiceRef.current = AvatarService
      videoServiceRef.current = VideoService
      deepgramServiceRef.current = DeepgramService
      llmServiceRef.current = LLMService
      sttServiceRef.current = STTService
    }catch(e){
      console.error(e)
    }

    if(avatarServiceRef.current){
      EventService.emit(AvatarEvents.AVATAR_INITIALIZE)
    }
      
  }, [])

  return (
    <WaitingRoom/>
  )
}
