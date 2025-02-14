'use client'
import { useEffect, useRef, useState } from 'react'
import { Button, Container, Col, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import { VideoEvents } from '@/util/video-types'
import AvatarEvents from '@/util/avatar-types'
import STTEvents from '@/util/stt-types'
import DeepgramEvents from '@/util/deepgram-types'


const VideoRoom: React.FC = () => {

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)

  // const [isGoodbye, setIsGoodbye] = useState<boolean>(false)

  // const [room, setRoom] = useState<Room | null>(null)
  const remoteVideoRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()

    // Global Mounting    
    useEffect(() => {

      // register listeners
      EventService.on(VideoEvents.VIDEO_HTML_REQUESTED, (html: HTMLDivElement) => {
     
        if(!html) throw new Error('no video room element available')
        remoteVideoRef.current!.innerHTML = ''
        remoteVideoRef.current!.appendChild(html)

        // once this is done initiate the welcome message
        EventService.emit(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE)

      })

      // get the room and the video/audio tracks and show on this page
      EventService.emit(VideoEvents.VIDEO_REQUEST_HTML)


      // attach this user to room


      return () => {

        console.log('unmounting the Video Room')
        EventService.emit(AvatarEvents.AVATAR_END_SESSION)
        EventService.emit(VideoEvents.VIDEO_END_SESSION)
        EventService.emit(STTEvents.STT_END_SESSION)
        EventService.emit(DeepgramEvents.DEEPGRAM_END_SESSION)
      }
        
    }, [])


  const endSession = async () => {
      router.push('/goodbye')
  }
   
    return (
      <div className="video-room-container">
        <Container className="mt-5">
          <h1 className="text-center">Avatar Video Room</h1>
          <Row className="justify-content-center">
            <Col md={6}>
              <div ref={remoteVideoRef} style={
                { 
                  width: '100%', 
                  minHeight: '400px', 
                  backgroundColor: '#000' 
                }}>
                <p className="text-white text-center">Waiting for avatar...</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={endSession} 
                className="mt-3"
                style={{ width: 'auto'}}
              >
                End Session
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    )
}

export default VideoRoom
