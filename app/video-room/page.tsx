'use client'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Container, Col, Row } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import { VideoEvents } from '@/util/video-types'
import AvatarEvents from '@/util/avatar-types'
import STTEvents from '@/util/stt-types'
import DeepgramEvents from '@/util/deepgram-types'
import { logInfo } from '@/services/logger-service'
import { EmotionEvents } from '@/util/emotion-types'
import llmTypes from '@/util/llm-types'


const VideoRoom: React.FC = () => {

  const remoteVideoRef = useRef<HTMLDivElement | null>(null)
  const localVideoRef = useRef<HTMLDivElement | null>(null)

  const [userName, setUserName] = useState<string>('')
  const selectedAudioDeviceRef = useRef<string | ''>('')
  const selectedVideoDeviceRef = useRef<string | ''>('')
  const searchParams = useRef<URLSearchParams | null>(null)
  const [title, setTitle] = useState<string>('')

  const router = useRouter()

    // Global Mounting    
    useEffect(() => {

      const handleRemoteVideoHTMLRequested = (html: HTMLDivElement) => {
        const interval = setInterval(() => {
          if(remoteVideoRef.current){
            remoteVideoRef.current.innerHTML = ''
            remoteVideoRef.current.appendChild(html)
            EventService.emit(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE)
            clearInterval(interval)
          }
        }, 100)
      }

      const handleLocalVideoHTMLRequested = (html: HTMLDivElement) => {
        
        const interval = setInterval(() => {
          if(localVideoRef.current){
            localVideoRef.current.innerHTML = ''
            localVideoRef.current.appendChild(html)
            logInfo(`Video-Room: handleLocalVideoHTMLRequested ${html.innerHTML}`)
            clearInterval(interval)
          }
        }, 100)
      }

      const handleRoomDetailsRequest = (roomPrefs: any) => {
        const { UniqueName } = roomPrefs
        setTitle(UniqueName)
      }

      EventService.on(VideoEvents.VIDEO_ROOM_DETAILS_GIVEN, handleRoomDetailsRequest)
      EventService.emit(VideoEvents.VIDEO_ROOM_DETAILS)

      EventService.on(VideoEvents.VIDEO_REMOTE_HTML_REQUESTED, handleRemoteVideoHTMLRequested)
      EventService.emit(VideoEvents.VIDEO_REQUEST_REMOTE_HTML)

      EventService.on(VideoEvents.VIDEO_LOCAL_HTML_REQUESTED, handleLocalVideoHTMLRequested)
      EventService.emit(VideoEvents.VIDEO_REQUEST_LOCAL_HTML, selectedVideoDeviceRef.current)

      EventService.emit(EmotionEvents.EMOTIONS_START_EMOTION_CAPTURE)

      return () => {
        EventService.off(VideoEvents.VIDEO_REMOTE_HTML_REQUESTED, handleRemoteVideoHTMLRequested)
        EventService.off(VideoEvents.VIDEO_LOCAL_HTML_REQUESTED, handleLocalVideoHTMLRequested)
        EventService.off(VideoEvents.VIDEO_ROOM_DETAILS_GIVEN, handleRoomDetailsRequest)
        EventService.emit(AvatarEvents.AVATAR_END_SESSION)
        EventService.emit(VideoEvents.VIDEO_END_SESSION)
        EventService.emit(STTEvents.STT_END_SESSION)
        EventService.emit(DeepgramEvents.DEEPGRAM_END_SESSION)
        EventService.emit(EmotionEvents.EMOTIONS_STOP_EMOTION_CAPTURE)
        EventService.emit(llmTypes.LLM_SESSION_ENDED)
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
  
              <h1 className="text-center fw-bold mb-4">{title}</h1>
  
              {/* 1) make this parent relative */}
              <div style={{ position: 'relative', width: '100%', minHeight: 400 }}>
  
                {/* 2) remote video stays full width */}
                <div 
                  ref={remoteVideoRef} 
                  className="d-flex align-items-center justify-content-center bg-dark rounded"
                  style={{ 
                    width: '100%', 
                    height: '100%',  // fill parent
                    overflow: 'hidden',
                    borderRadius: '12px'
                  }}
                >
                  <p className="text-white text-center m-0 fw-semibold">
                    Waiting for avatar...
                  </p>
                </div>
  
                {/* 3) local video goes absolute top right, smaller */}
                <div
                  ref={localVideoRef}
                  className="d-flex align-items-center justify-content-center bg-dark rounded"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '25%',             // adjust as desired
                    aspectRatio: '16/9',      // preserve ratio
                    overflow: 'hidden',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <p className="text-white text-center m-0 fw-semibold">
                    Waiting local…
                  </p>
                </div>
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
