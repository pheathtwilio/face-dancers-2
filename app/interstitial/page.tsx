'use client'
import { useEffect } from 'react'
import { Button, Card, Container, Col, Row } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

const Interstitial: React.FC = () => {

    const router = useRouter()

    // Global Mounting    
    useEffect(() => {

  

      return () => {

      }
        
    }, [])


    const handleEnter = () => {
      router.push('/waiting-room')
    }

   
    return (
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Row>
          <Col className="text-center">
            <Card className="p-4 shadow-sm border-0">
              <Card.Body>
                <h1 className="fw-bold">Interstitial</h1>
                <p className="lead text-muted">
                  Google requires a user gesture before capturing audio in the browser. 
                  Please press the button below before we proceed.
                </p>
                <Button variant="dark" onClick={handleEnter} className="mt-3 btn-lg">
                  Let's Go!
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
}

export default Interstitial
