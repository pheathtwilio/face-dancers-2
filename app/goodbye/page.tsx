'use client'

import React from 'react'
import { Button, Container, Row, Col } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

export default function GoodbyePage() {
  
  const router = useRouter()

  const handleReturn = () => {
    router.push('/') // Adjust the path as needed
  }

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
      <Row>
        <Col className="text-center">
          <h1>Goodbye</h1>
          <Button variant="primary" onClick={handleReturn} className="mt-3">
            Return to Waiting Room
          </Button>
        </Col>
      </Row>
    </Container>
  )
}
