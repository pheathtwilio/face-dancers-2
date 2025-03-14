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

        // initiate the avatar 
        // initializeAvatar()     

        EventService.on(AvatarEvents.AVATAR_SESSIONS_GOT, (sessions) => {
          console.log(`ADMIN received ${sessions}`)
        })
        EventService.on(VideoEvents.VIDEO_ROOMS_LISTED, (rooms) => {
          console.log(rooms)
          setVideoRooms(rooms)
        })  
        
        try {
          videoServiceRef.current = VideoService
        }catch(e){
          console.error(e)
        }



    }, [])

    const listSessions = async () => {
      console.log('listSessions clicked')
      if(avatarServiceRef.current){
        console.log(`Admin - sending event ${AvatarEvents.AVATAR_GET_SESSIONS}`)
        EventService.emit(AvatarEvents.AVATAR_GET_SESSIONS)
      }
    }

    const endSession = async (session_id: string) => {

      let data: object = {}
      // if(avatarServiceRef.current){
          EventService.emit(AvatarEvents.AVATAR_CLOSE_SESSION, (session_id))
      // }

      console.log(data)
    }

    const listRooms = async () => {
      console.log('listrooms has been clicked')
      EventService.emit(VideoEvents.VIDEO_LIST_ROOMS)
    }

    const endRoom = async (roomSid: string) => {

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
