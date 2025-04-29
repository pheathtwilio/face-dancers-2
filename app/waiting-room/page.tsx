'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Container, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap'
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
import DeepgramEvents from '@/util/deepgram-types'
import EmotionService from '@/services/emotion-service'

import { logInfo, logError } from '@/services/logger-service'

const WaitingRoom: React.FC = () => {
  const router = useRouter()

  // Service refs
  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)
  const deepgramServiceRef = useRef<typeof DeepgramService | null>(null)
  const llmServiceRef = useRef<typeof LLMService | null>(null)
  const sttServiceRef = useRef<typeof STTService | null>(null)
  const emotionServiceRef = useRef<typeof EmotionService | null>(null)

  // Audio device: both ref (for sync) and state (for UI)
  const selectedAudioDeviceRef = useRef<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')

  // Video device: both ref (for sync) and state (for UI)
  const selectedVideoDeviceRef = useRef<string>('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')

  // Other UI state
  const [participants, setParticipants] = useState<number>(0)
  const [participantName, setParticipantName] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [audioAccessGranted, setAudioAccessGranted] = useState<boolean>(false)
  const [videoAccessGranted, setVideoAccessGranted] = useState<boolean>(false)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false)

  // INITIAL MOUNT: services, permissions, devices, participant events
  useEffect(() => {
    const startDeepgram = () => {
      EventService.emit(DeepgramEvents.DEEPGRAM_START_SESSION)
    }

    try {
      avatarServiceRef.current   = AvatarService
      videoServiceRef.current    = VideoService
      deepgramServiceRef.current = DeepgramService
      emotionServiceRef.current = EmotionService

      startDeepgram()
      llmServiceRef.current = LLMService
      sttServiceRef.current = STTService
    } catch (e) {
      logError(`Waiting-Room: Mounting Error ${e}`)
    }

    // Initialize avatar
    if (avatarServiceRef.current) {
      EventService.emit(AvatarEvents.AVATAR_INITIALIZE)
    }

    // Permissions & devices
    checkMediaPermissions()
    fetchDevices()

    // Listen for someone joining
    const onJoined = (name: string) => {
      setParticipants(prev => prev + 1)
      setParticipantName(name)
      setLoading(false)
    }
    EventService.on(VideoEvents.VIDEO_PARTICIPANT_JOINED, onJoined)

    return () => {
      EventService.off(DeepgramEvents.DEEPGRAM_START_SESSION, startDeepgram)
      EventService.off(VideoEvents.VIDEO_PARTICIPANT_JOINED, onJoined)
    }
  }, [])

  // ONCE: initialize from URL params (no STT listener to avoid loops)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const mic = params.get('microphone') || ''
      const cam = params.get('video')      || ''
      const uname = params.get('username') || ''

      setUserName(uname)

      if (mic) {
        selectedAudioDeviceRef.current = mic
        setSelectedAudioDevice(mic)
        attachTrack(mic)
      }
      if (cam) {
        selectedVideoDeviceRef.current = cam
        setSelectedVideoDevice(cam)
      }
    }
  }, [])

  // PERMISSIONS
  const checkMediaPermissions = async () => {
    try {
      const audioStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      const videoStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })

      setAudioAccessGranted(audioStatus.state === 'granted')
      setVideoAccessGranted(videoStatus.state === 'granted')

      audioStatus.onchange = () => setAudioAccessGranted(audioStatus.state === 'granted')
      videoStatus.onchange = () => setVideoAccessGranted(videoStatus.state === 'granted')

      logInfo(`AudioAccess: ${audioStatus.state}, VideoAccess: ${videoStatus.state}`)

      if (audioStatus.state !== 'granted' || videoStatus.state !== 'granted') {
        setShowPermissionModal(true)
      }
    } catch (e) {
      logError(`Waiting-Room: Check Media Permissions Error ${e}`)
    }
  }

  // FETCH DEVICES
  const fetchDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
    } catch (e) {
      logError(`Waiting-Room: Error Accessing Media Devices ${e}`)
    }
  }

  // HANDLERS: audio/video changes
  function handleAudioChange(deviceId: string) {
    selectedAudioDeviceRef.current = deviceId
    attachTrack(deviceId)
    setSelectedAudioDevice(deviceId)
  }
  function handleVideoChange(deviceId: string) {
    selectedVideoDeviceRef.current = deviceId
    setSelectedVideoDevice(deviceId)
  }

  // STT attach
  const attachTrack = (deviceId: string) => {
    EventService.emit(STTEvents.STT_ATTACH_AUDIO_TRACK, deviceId)
  }

  // JOIN / END
  const joinRoom = async () => {
    EventService.emit(
      VideoEvents.VIDEO_JOIN_PARTICIPANT,
      userName,
      selectedAudioDeviceRef.current,
      selectedVideoDeviceRef.current
    )
    router.push(
      `/video-room?username=${encodeURIComponent(userName)}&microphone=${selectedAudioDeviceRef.current}&video=${selectedVideoDeviceRef.current}`
    )
  }

  const endSession = async () => {
    logInfo('Waiting-Room: Calling End Session')
    EventService.emit(AvatarEvents.AVATAR_END_SESSION)
    EventService.emit(VideoEvents.VIDEO_END_SESSION)
    EventService.emit(STTEvents.STT_END_SESSION)
    EventService.emit(DeepgramEvents.DEEPGRAM_END_SESSION)
    router.push(
      `/goodbye?username=${encodeURIComponent(userName)}&microphone=${selectedAudioDeviceRef.current}&video=${selectedVideoDeviceRef.current}`
    )
  }

  return (
    <div className='waiting-room-container'>
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="p-4 shadow-sm border-0">
              <Card.Body>
                <h1 className="text-center fw-bold mb-4 d-flex justify-content-center align-items-center gap-2">
                  Waiting Room {loading && <Spinner animation="border" variant="dark" size="sm" />}
                </h1>

                <Modal
                  show={showPermissionModal}
                  onHide={() => setShowPermissionModal(false)}
                  centered
                  dialogClassName="custom-modal"
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Media Permissions Required</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p>We need access to your microphone and camera for this meeting.</p>
                    {!audioAccessGranted && <p>🎤 Microphone access is <strong>not granted</strong>.</p>}
                    {!videoAccessGranted && <p>📷 Camera access is <strong>not granted</strong>.</p>}
                    <p>Please allow permissions in your browser settings and refresh the page.</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="dark" onClick={() => window.location.reload()}>
                      Reload
                    </Button>
                  </Modal.Footer>
                </Modal>

                {loading ? (
                  <div className="text-center">
                    <p className="mt-3 fw-semibold text-muted">Waiting for the avatar to join...</p>
                  </div>
                ) : participants < 1 ? (
                  <Alert variant="warning" className="text-center fw-semibold">
                    Waiting for more participants to join...
                  </Alert>
                ) : (
                  <Alert variant="dark" className="text-center fw-semibold">
                    Participant <strong>{participantName}</strong> has joined, you can now enter the room.
                  </Alert>
                )}

                <Form>
                  {/* Details */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Details</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>Participants</InputGroup.Text>
                      <Form.Control value={participants.toString()} readOnly className="bg-light" />
                    </InputGroup>
                  </Form.Group>

                  {/* Username */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Username</Form.Label>
                    <Form.Control
                      type="text" placeholder="Enter your username"
                      value={userName} onChange={e => setUserName(e.target.value)}
                    />
                  </Form.Group>

                  {/* Audio Device */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Audio Device</Form.Label>
                    <Form.Select
                      value={selectedAudioDevice}
                      onChange={e => handleAudioChange(e.target.value)}
                    >
                      <option value="">Select Audio Device</option>
                      {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.substring(0, 6)}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Video Device */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Video Device</Form.Label>
                    <Form.Select
                      value={selectedVideoDevice}
                      onChange={e => handleVideoChange(e.target.value)}
                    >
                      <option value="">Select Video Device</option>
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.substring(0, 6)}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Join & End */}
                  <Button
                    variant="dark" onClick={joinRoom}
                    className="w-100 btn-lg"
                    disabled={
                      !userName ||
                      !selectedAudioDeviceRef.current ||
                      !selectedVideoDeviceRef.current ||
                      participants < 1
                    }
                  >
                    Join Room
                  </Button>

                  <Button
                    variant="secondary" onClick={endSession}
                    className="w-100 btn-lg mt-3"
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
