'use client'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button,Container, Col, Form, ListGroup, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import AvatarEvents from '@/util/avatar-types'
import AvatarServiceClass from '@/services/avatar-service'
import { useRouter } from 'next/navigation'


const WaitingRoom: React.FC = () => {

    const router = useRouter()

    const avatarServiceRef = useRef<typeof AvatarServiceClass | null>(null)
    const [sessions, setSessions] = useState<object[]>([])
    

    // Global Mounting    
    useEffect(() => {

        // initiate the avatar 
        initializeAvatar()       
        
    }, [])

    const initializeAvatar = async () => {
      try {
        avatarServiceRef.current = AvatarService

        if(avatarServiceRef.current){
            await listSessions()
        } else {

            // TODO 
            // const interval = setInterval(() => {
            //     if (avatarServiceRef.current) {
            //         avatarServiceRef.current.on(AvatarEvents.AVATAR_STARTED_SESSION, async () => {
            //             await listSessions()
            //         })
            //         clearInterval(interval)  
            //     }
            // }, 1000)  
        }

      }catch(e){
        console.error(e)
      }
    }

    const listSessions = async () => {
      if(avatarServiceRef.current){
        let sessions = await avatarServiceRef.current.getSessions()
        console.log(sessions)
        setSessions(sessions ?? [])
      }
    }

    const endSession = async (session_id: string) => {

        let data: object = {}
        if(avatarServiceRef.current){
            console.log('calling end session for ', session_id)
            let data = await avatarServiceRef.current.closeSession(session_id)
            if(data.message === 'success'){
                await listSessions()
            }
        }

        console.log(data)
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
              List Sessions
            </Button>
            <ListGroup className="mt-3">
                {sessions.length > 0 ? (
                    sessions.map((session: any) => (
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
          </Form>
        </Col>
      </Row>
    </Container>

        </div>
    )
}

export default WaitingRoom
