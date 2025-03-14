'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button,Container, Col, Form, ListGroup, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import AvatarEvents from '@/util/avatar-types'
import AvatarServiceClass from '@/services/avatar-service'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import VideoService from '@/services/video-service'
import { VideoEvents } from '@/util/video-types'


const WaitingRoom: React.FC = () => {

    // const router = useRouter()

    const avatarServiceRef = useRef<typeof AvatarService | null>(null)
    const videoServiceRef = useRef<typeof VideoService | null>(null)
    const [avatarSessions, setAvatarSessions] = useState<object[]>([])
    const [videoRooms, setVideoRooms] = useState<object[]>([])
    

    // Global Mounting    
    useEffect(() => {

        EventService.on(AvatarEvents.AVATAR_SESSIONS_GOT, (sessions) => {
          console.log(sessions)
          setAvatarSessions(sessions)
        })
        EventService.on(VideoEvents.VIDEO_ROOMS_LISTED, (rooms) => {
          setVideoRooms(rooms)
        })  
        
        try {
          avatarServiceRef.current = AvatarService
          videoServiceRef.current = VideoService

          // get the sessions if they exist
          listSessions()

          // get the video rooms if they exist
          listRooms()

        }catch(e){
          console.error(e)
        }

    }, [])
 
    const listSessions = async () => {
      EventService.emit(AvatarEvents.AVATAR_GET_SESSIONS)
    }

    const endSession = async (session_id: string) => {
      EventService.emit(AvatarEvents.AVATAR_CLOSE_SESSION, (session_id))
    }

    const listRooms = async () => {
      EventService.emit(VideoEvents.VIDEO_LIST_ROOMS)
    }

    const endRoom = async (roomSid: string) => {
      EventService.emit(VideoEvents.VIDEO_END_ROOM, (roomSid))
    }

    return (
        <div className='admin-container'>
            <Container className='mt-5'>
      <h1 className='text-center'>Admin</h1>
      <Row className='justify-content-center'>
        <Col md={6}>
          <Form>

            <Alert variant='warning' className='text-center'>
                Heygen Session Management
            </Alert>
            <Button
              variant='secondary'
              onClick={listSessions}
              className='w-100 mt-3'
            >
              List Avatar Sessions
            </Button>
            <ListGroup className="mt-3">
                {avatarSessions.length > 0 ? (
                    avatarSessions.map((session: any) => (
                        <ListGroup.Item key={session.session_id}>
                            <Row className="align-items-center">
                                <Col>
                                    <strong>Session ID:</strong> {session.session_id} <br />
                                    <strong>Status:</strong> {session.status} <br />
                                    <strong>Created At:</strong> {new Date(session.created_at * 1000).toLocaleString()}
                                </Col>
                                <Col className="text-right">
                                    <Button 
                                        variant="danger" 
                                        onClick={() => endSession(session.session_id)}
                                    >
                                        End Session
                                    </Button>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                    ))
                ) : (
                    <ListGroup.Item>No active sessions</ListGroup.Item>
                )}
            </ListGroup>
            <Alert variant='warning' className='text-center'>
                Twilio Video Room Management
            </Alert>
            <Button
              variant='secondary'
              onClick={listRooms}
              className='w-100 mt-3'
            >
              List Video Rooms
            </Button>
            <ListGroup className="mt-3">
                {videoRooms.length > 0 ? (
                    videoRooms.map((room: any) => (
                        <ListGroup.Item key={room.sid}>
                            <Row className="align-items-center">
                                <Col>
                                    <strong>Room SID:</strong> {room.sid} <br />
                                    <strong>Status:</strong> {room.status} <br />
                                    <strong>Created At:</strong> {new Date(room.date_created).toLocaleString()}
                                </Col>
                                <Col className="text-right">
                                    <Button 
                                        variant="danger" 
                                        onClick={() => endRoom(room.sid)}
                                    >
                                        End Room
                                    </Button>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                    ))
                ) : (
                    <ListGroup.Item>No active Rooms</ListGroup.Item>
                )}
            </ListGroup>
          </Form>
        </Col>
      </Row>
    </Container>

        </div>
    )
}

export default WaitingRoom
