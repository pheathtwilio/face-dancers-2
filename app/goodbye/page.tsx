'use client'

import React from 'react'
import { Button, Card, Container, Row, Col } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function GoodbyePage() {
  
  const router = useRouter()

  const handleReturn = () => {
    router.push('/') // Adjust the path as needed
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
