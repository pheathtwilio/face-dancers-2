'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Card, Container, Row, Col } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function GoodbyePage() {
  
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const searchParams = useRef<URLSearchParams | null>(null)

  useEffect(() => {

    if(typeof window !== 'undefined'){
      searchParams.current = new URLSearchParams(window.location.search)
    }
  
    if(searchParams.current){
      const name = searchParams.current.get('username') || ''
      setUserName(name)
    }

  }, [searchParams])

  const handleReturn = () => {
    router.push(`/interstitial/?username=${userName}`) // Adjust the path as needed
  }

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <Row>
        <Col className="text-center">
          <Card className="p-4 shadow-sm border-0">
            <Card.Body>
              <h1 className="fw-bold">Goodbye</h1>
              <p className="text-muted">Thank you for joining! You can return to the waiting room if needed.</p>
              <Button variant="dark" onClick={handleReturn} className="mt-3 btn-lg">
                Return to Waiting Room
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
