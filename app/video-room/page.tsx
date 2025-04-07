'use client'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Container, Col, Row } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import { VideoEvents } from '@/util/video-types'
import AvatarEvents from '@/util/avatar-types'
import STTEvents from '@/util/stt-types'
import DeepgramEvents from '@/util/deepgram-types'


const VideoRoom: React.FC = () => {

  const remoteVideoRef = useRef<HTMLDivElement | null>(null)

  const [userName, setUserName] = useState<string>('')
  const selectedAudioDeviceRef = useRef<string | ''>('')
  const selectedVideoDeviceRef = useRef<string | ''>('')
  const searchParams = useRef<URLSearchParams | null>(null)

  const router = useRouter()

    // Global Mounting    
    useEffect(() => {

      const handleVideoHTMLRequested = (html: HTMLDivElement) => {
        const interval = setInterval(() => {
          if(remoteVideoRef.current){
            remoteVideoRef.current.innerHTML = ''
            remoteVideoRef.current.appendChild(html)
            EventService.emit(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE)
            clearInterval(interval)
          }
        }, 100)
      }

      EventService.on(VideoEvents.VIDEO_HTML_REQUESTED, handleVideoHTMLRequested)
      EventService.emit(VideoEvents.VIDEO_REQUEST_HTML)

      return () => {
        EventService.off(VideoEvents.VIDEO_HTML_REQUESTED, handleVideoHTMLRequested)
        EventService.emit(AvatarEvents.AVATAR_END_SESSION)
        EventService.emit(VideoEvents.VIDEO_END_SESSION)
        EventService.emit(STTEvents.STT_END_SESSION)
        EventService.emit(DeepgramEvents.DEEPGRAM_END_SESSION)
      }
        
    }, [])

  useEffect(() => {

    if(typeof window !== 'undefined'){
      searchParams.current = new URLSearchParams(window.location.search)
    }
  
    if(searchParams.current){
      setUserName(searchParams.current.get('username') || '')
      selectedAudioDeviceRef.current = searchParams.current.get('microphone') || ''
      selectedVideoDeviceRef.current = searchParams.current.get('video') || ''
    }

  }, [searchParams])


  const endSession = async () => {
    router.push(`/goodbye?username=${userName}&microphone=${selectedAudioDeviceRef.current}&video=${selectedVideoDeviceRef.current}`)
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
