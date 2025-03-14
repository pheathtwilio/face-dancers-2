'use client'
import { useEffect, useRef } from 'react'
import { Button, Card, Container, Col, Row } from 'react-bootstrap'
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
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="p-4 shadow-sm border-0">
              <Card.Body>
                <h1 className="text-center fw-bold mb-4">Avatar Video Room</h1>
                <div 
                  ref={remoteVideoRef} 
                  className="d-flex align-items-center justify-content-center bg-dark rounded"
                  style={{ 
                    width: '100%', 
                    minHeight: '400px', 
                    overflow: 'hidden',
                    borderRadius: '12px'
                  }}
                >
                  <p className="text-white text-center m-0 fw-semibold">Waiting for avatar...</p>
                </div>
                <Button 
                  variant="dark" 
                  onClick={endSession} 
                  className="w-100 btn-lg mt-4"
                >
                  End Session
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
}

export default VideoRoom
