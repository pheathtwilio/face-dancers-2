'use client'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import EventService from '@/services/event-service'
import dynamic from 'next/dynamic'
import { useRef, useEffect } from 'react'
import AvatarEvents from '@/util/avatar-types'

const WaitingRoom = dynamic(() => import('../app/waiting-room/page'))

export default function Home() {

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)

  // Global Mounting    
  useEffect(() => {

    // this initializes both of these singleton classes
    try {
      avatarServiceRef.current = AvatarService
      videoServiceRef.current = VideoService
    }catch(e){
      console.error(e)
    }

    if(avatarServiceRef.current){
      
      EventService.emit(AvatarEvents.AVATAR_INITIALIZE)
      EventService.on(AvatarEvents.AVATAR_STARTED_SESSION, (stream: MediaStream) => {

      })
    }
      
  }, [])

  return (
    <WaitingRoom/>
  )
}
