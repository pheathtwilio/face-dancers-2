'use client'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import EventService from '@/services/event-service'
import dynamic from 'next/dynamic'
import { useRef, useEffect } from 'react'
import { VideoEvents } from '@/util/video-types'
import AvatarEvents from '@/util/avatar-types'

const WaitingRoom = dynamic(() => import('../app/waiting-room/page'))




export default function Home() {

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)

  // Global Mounting    
  useEffect(() => {

    // register listeners
 

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
        // create a video room and connect the avatar
      })
    }

    if(videoServiceRef.current){
      // do all the video initialization things
    }
      
  }, [])

  return (
    <WaitingRoom/>
  )
}
