'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button,Container, Col, Form, InputGroup, ListGroup, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import AvatarServiceClass from '@/services/avatar-service'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import VideoServiceClass from '@/services/video-service'
import AvatarEvents from '@/util/avatar-types'
import { VideoEvents } from '@/util/video-types'
import VideoService from '@/services/video-service'


const WaitingRoom: React.FC = () => {

  const router = useRouter()

    // state
    // const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams())
    const [participants, setParticipants] = useState<number>(0)
    const [participantName, setParticipantName] = useState<string>('')
    const [userName, setUserName] = useState<string>('')
    const [urlUserName, setUrlUserName] = useState<string>('')
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')

    const [isNavigatingToRoom, setIsNavigatingToRoom] = useState<boolean>(false)
    // const [isGoodbye, setIsGoodbye] = useState<boolean>(false)
    
    const avatarServiceRef = useRef<typeof AvatarServiceClass | null>(null)
    const videoServiceRef = useRef<typeof VideoService | null>(null)
  
    const searchParams = useRef<URLSearchParams | null>(null)
    // const [sessions, setSessions] = useState<object[]>([])
  

    // Global Mounting    
    useEffect(() => {

        if(typeof window !== 'undefined'){
          searchParams.current = new URLSearchParams(window.location.search)
        }

        fetchDevices()

        // setup listeners
        EventService.on(VideoEvents.VIDEO_PARTICIPANT_JOINED, (userName) => {
          setParticipants(participants+1)
          // setParticipantName(object.name)
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

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();

        setAudioDevices(devices.filter((device) => device.kind === 'audioinput'));
        setVideoDevices(devices.filter((device) => device.kind === 'videoinput'))

      } catch (e) {
          console.error('Error accessing media devices:', e)
      }
    }

    // const initializeAvatar = async () => {
    //   try {
    //     avatarServiceRef.current = AvatarService
    //   }catch(e){
    //     console.error(e)
    //   }
    // }

    // const initializeVideo = async () => {
    //   try {
    //     videoServiceRef.current = VideoService
    //   }catch(e){
    //     console.error(e)
    //   }
    // }

    // const createRoom = () => {
    //   console.log("CREATING ROOM")
    //   EventService.emit(VideoEvents.VIDEO_CREATE_ROOM, {
    //     audioDeviceId: selectedAudioDevice,
    //     videoDeviceId: selectedVideoDevice,
    //     userName: 'temp',
    //     roomName: 'temp'
    //   })
    // }

    const joinRoom = async () => {

        // add this participant to the video room too!

        // also add the audio track to the llm service

        router.push('/video-room')
    }

    const endSession = async () => {

        console.log('calling end session')
        EventService.emit(AvatarEvents.AVATAR_END_SESSION)
        EventService.emit(VideoEvents.VIDEO_END_SESSION)
  
        // then reroute to goodbye page
        router.push('/goodbye')
    }

    return (
        <div className='waiting-room-container'>
            <Container className='mt-5'>
      <h1 className='text-center'>Waiting Room</h1>
      <Row className='justify-content-center'>
        <Col md={6}>
          <Form>

            {participants < 1 && (
                <Alert variant='warning'>
                    Waiting for more participants to join...
                </Alert>
            )}

            {participants > 0 && (    
                <Alert variant='dark' className='text-center'>
                    Participant {participantName} has joined you can now enter the room
                </Alert>
            )}

            <Form.Group className='mb-3'>
                <Form.Label>Details</Form.Label>
                <InputGroup className='mb-3'>
                    <InputGroup.Text id='basic-addon1'>Participants</InputGroup.Text>
                    <Form.Control
                        placeholder={participants.toString()}
                        aria-label='participants'
                        aria-describedby='basic-addon1'
                        readOnly={true}
                    />
                </InputGroup>
            </Form.Group>


            <Form.Group className='mb-3'>
              <Form.Label>Username</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter your username'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                readOnly={!!urlUserName} // Make the field read-only if username is from the URL
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Audio Device</Form.Label>
              <Form.Select
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
              >
                <option value=''>Select Audio Device</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label.length > 0 ? device.label : `Microphone ${device.deviceId.substring(0, 6)}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Video Device</Form.Label>
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
              variant='primary'
              onClick={joinRoom}
              className='w-100 mt-3'
              disabled={!userName || !selectedAudioDevice || !selectedVideoDevice || participants < 1} // Disable until all fields are filled
            >
              Join Room
            </Button>

            
            <Button
              variant='secondary'
              onClick={endSession}
              className='w-100 mt-3'
              // disabled={!avatarServiceRef.current} // Disable until all fields are filled
            >
              End Session
            </Button>

          </Form>
        </Col>
      </Row>
    </Container>

        </div>
    )
}

export default WaitingRoom
