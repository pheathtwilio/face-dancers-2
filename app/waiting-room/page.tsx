'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Container, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import AvatarEvents from '@/util/avatar-types'
import { VideoEvents } from '@/util/video-types'
import STTEvents from '@/util/stt-types'

import EventService from '@/services/event-service'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import DeepgramService from '@/services/deepgram-service'
import LLMService from '@/services/llm-service'
import STTService from '@/services/speech-to-text-service'


const WaitingRoom: React.FC = () => {

  const router = useRouter()

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)
  const deepgramServiceRef = useRef<typeof DeepgramService | null>(null)
  const llmServiceRef = useRef<typeof LLMService | null>(null)
  const sttServiceRef = useRef<typeof STTService | null>(null)

  const [participants, setParticipants] = useState<number>(0)
  const [participantName, setParticipantName] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)

  const searchParams = useRef<URLSearchParams | null>(null)

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

      // initialization routine
      if(avatarServiceRef.current){
        EventService.emit(AvatarEvents.AVATAR_INITIALIZE)
      }

      // get params if window is defined
      if(typeof window !== 'undefined'){
        searchParams.current = new URLSearchParams(window.location.search)
      }

      fetchDevices()

      // setup listeners
      EventService.on(VideoEvents.VIDEO_PARTICIPANT_JOINED, (userName) => {
        setParticipants(participants+1)
        // setParticipantName(userName)
      })
    

      // cleanup function
      return () => {} // no cleanup, the intent is to move to the next page  
        
  }, [])

  // get the username from the params
  useEffect(() => {

    if(searchParams.current){
      const name = searchParams.current.get('username') || ''
      setUserName(name)
    }

  }, [searchParams])


  const fetchDevices = async () => {
    if(typeof window === 'undefined') return

    try {

      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((device) => device.kind === 'audioinput'));
      setVideoDevices(devices.filter((device) => device.kind === 'videoinput'))

    } catch (e) {
        console.error('Error accessing media devices:', e)
    }
  }

  const joinRoom = async () => {

      EventService.emit(VideoEvents.VIDEO_JOIN_PARTICIPANT, userName, selectedAudioDevice, selectedVideoDevice)
      EventService.emit(STTEvents.STT_ATTACH_AUDIO_TRACK, selectedAudioDevice)

      router.push('/video-room')
  }

  const endSession = async () => {

      console.log('calling end session')
      EventService.emit(AvatarEvents.AVATAR_END_SESSION)
      EventService.emit(VideoEvents.VIDEO_END_SESSION)
      router.push('/goodbye')
  }

  return (
      <div className='waiting-room-container'>
          <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
          <Row className="w-100 justify-content-center">
            <Col md={8} lg={6}>
              <Card className="p-4 shadow-sm border-0">
                <Card.Body>
                  <h1 className="text-center fw-bold mb-4">Waiting Room</h1>

                  {participants < 1 ? (
                    <Alert variant='warning' className='text-center fw-semibold'>
                      Waiting for more participants to join...
                    </Alert>
                  ) : (
                    <Alert variant='dark' className='text-center fw-semibold'>
                      Participant <strong>{participantName}</strong> has joined, you can now enter the room.
                    </Alert>
                  )}

                  <Form>
                    <Form.Group className='mb-3'>
                      <Form.Label className="fw-semibold">Details</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>Participants</InputGroup.Text>
                        <Form.Control value={participants.toString()} readOnly className="bg-light" />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className='mb-3'>
                      <Form.Label className="fw-semibold">Username</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder='Enter your username'
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className='mb-3'>
                      <Form.Label className="fw-semibold">Audio Device</Form.Label>
                      <Form.Select
                        value={selectedAudioDevice}
                        onChange={(e) => setSelectedAudioDevice(e.target.value)}
                      >
                        <option value=''>Select Audio Device</option>
                        {audioDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.substring(0, 6)}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className='mb-3'>
                      <Form.Label className="fw-semibold">Video Device</Form.Label>
                      <Form.Select
                        value={selectedVideoDevice}
                        onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      >
                        <option value=''>Select Video Device</option>
                        {videoDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Button
                      variant='dark'
                      onClick={joinRoom}
                      className='w-100 btn-lg'
                      disabled={!userName || !selectedAudioDevice || !selectedVideoDevice || participants < 1}
                    >
                      Join Room
                    </Button>

                    <Button
                      variant='secondary'
                      onClick={endSession}
                      className='w-100 btn-lg mt-3'
                    >
                      End Session
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

      </div>
  )
}

export default WaitingRoom
