'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Container, Col, Form, ListGroup, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import AvatarEvents from '@/util/avatar-types'
import EventService from '@/services/event-service'
import VideoService from '@/services/video-service'
import { VideoEvents } from '@/util/video-types'
import { logError, logInfo } from '@/services/logger-service'


const AdminRoom: React.FC = () => {

    const avatarServiceRef = useRef<typeof AvatarService | null>(null)
    const videoServiceRef = useRef<typeof VideoService | null>(null)
    const [avatarSessions, setAvatarSessions] = useState<object[]>([])
    const [videoRooms, setVideoRooms] = useState<object[]>([])
    const [cache, setCache] = useState<string[]>([])
    

    // Global Mounting    
    useEffect(() => {

        EventService.on(AvatarEvents.AVATAR_SESSIONS_GOT, (sessions) => {
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

          // get the cache
          listCache()

        }catch(e){
          logError(`Admin: ${e}`)
        }

    }, [])
 
    const listSessions = async () => {
      EventService.emit(AvatarEvents.AVATAR_GET_SESSIONS)
    }

    const endSession = async (session_id: string) => {
      EventService.emit(AvatarEvents.AVATAR_CLOSE_SESSION, (session_id))
    }

    const listRooms = async () => {
      logInfo(`Admin: Listing Rooms`)
      EventService.emit(VideoEvents.VIDEO_LIST_ROOMS)
    }

    const endRoom = async (roomSid: string) => {
      EventService.emit(VideoEvents.VIDEO_END_ROOM, (roomSid))
    }
    
    const listCache = async () => {
      const response = await fetch('/api/upstash-get-all-sessions', { method: 'GET'})
      const payload = await response.json()
      setCache(payload.allKeys)
    }

    const endCache = async (key: string) => {
      const sessionId = key.split(":")[1]
      const res = await fetch('/api/upstash-delete-session', {
        method:  'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ sessionId }),
        cache:   'no-store'
      })
      if (!res.ok) {
        throw new Error(`Session DELETE failed (${res.status})`)
      }
    }

    const flushCache = async () => {

    }

    return (
        <div className='admin-container'>
            <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
              <Row className="w-100 justify-content-center">
                <Col md={8} lg={6}>
                  <Card className="p-4 shadow-sm border-0">
                    <Card.Body>
                      <h1 className="text-center fw-bold mb-4">Admin Dashboard</h1>

                      {/* Heygen Session Management */}
                      <Alert variant='warning' className='text-center fw-semibold'>
                        Heygen Session Management
                      </Alert>
                      <Button variant='dark' onClick={listSessions} className='w-100 btn-lg mb-3'>
                        List Avatar Sessions
                      </Button>
                      <ListGroup className="border rounded">
                        {avatarSessions.length > 0 ? (
                          avatarSessions.map((session: any) => (
                            <ListGroup.Item key={session.session_id} className="py-3">
                              <Row className="align-items-center">
                                <Col>
                                  <strong>Session ID:</strong> {session.session_id} <br />
                                  <strong>Status:</strong> {session.status} <br />
                                  <strong>Created At:</strong> {new Date(session.created_at * 1000).toLocaleString()}
                                </Col>
                                <Col xs="auto">
                                  <Button variant="danger" size="sm" onClick={() => endSession(session.session_id)}>
                                    End Session
                                  </Button>
                                </Col>
                              </Row>
                            </ListGroup.Item>
                          ))
                        ) : (
                          <ListGroup.Item className="text-muted text-center">No active sessions</ListGroup.Item>
                        )}
                      </ListGroup>

                      {/* Twilio Video Room Management */}
                      <Alert variant='warning' className='text-center mt-4 fw-semibold'>
                        Twilio Video Room Management
                      </Alert>
                      <Button variant='dark' onClick={listRooms} className='w-100 btn-lg mb-3'>
                        List Video Rooms
                      </Button>
                      <ListGroup className="border rounded">
                        {videoRooms.length > 0 ? (
                          videoRooms.map((room: any) => (
                            <ListGroup.Item key={room.sid} className="py-3">
                              <Row className="align-items-center">
                                <Col>
                                  <strong>Room SID:</strong> {room.sid} <br />
                                  <strong>Status:</strong> {room.status} <br />
                                  <strong>Created At:</strong> {new Date(room.date_created).toLocaleString()}
                                </Col>
                                <Col xs="auto">
                                  <Button variant="danger" size="sm" onClick={() => endRoom(room.sid)}>
                                    End Room
                                  </Button>
                                </Col>
                              </Row>
                            </ListGroup.Item>
                          ))
                        ) : (
                          <ListGroup.Item className="text-muted text-center">No active Rooms</ListGroup.Item>
                        )}
                      </ListGroup>


                      {/* Cache Management */}
                      <Alert variant='warning' className='text-center fw-semibold'>
                        Redis Cache
                      </Alert>
                      <Button variant='dark' onClick={listSessions} className='w-100 btn-lg mb-3'>
                        List Redis Cache
                      </Button>
                      <ListGroup className="border rounded">
                        {cache.length > 0 ? (
                          cache.map((item: any) => (
                            <ListGroup.Item key={item} className="py-3">
                              <Row className="align-items-center">
                                <Col>
                                  {item}
                                </Col>
                                <Col xs="auto">
                                  <Button variant="danger" size="sm" onClick={() => endCache(item)}>
                                    End Cache
                                  </Button>
                                </Col>
                              </Row>
                            </ListGroup.Item>
                          ))
                        ) : (
                          <ListGroup.Item className="text-muted text-center">No active sessions</ListGroup.Item>
                        )}
                      </ListGroup>

                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>

        </div>
    )
}

export default AdminRoom
