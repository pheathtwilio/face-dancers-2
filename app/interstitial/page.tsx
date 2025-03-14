'use client'
import { useEffect } from 'react'
import { Button, Container, Col, Row } from 'react-bootstrap'
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
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
            <Row>
              <Col className="text-center">
                <h1>Interstitial</h1>
                <p>
                  Because Google doesnt allow capturing of audio from the browser 
                  unless a user gesture has been performed, you absolutely must 
                  press this button before we do anything.
                </p>
                <Button variant="primary" onClick={handleEnter} className="mt-3">
                  Let's go!
                </Button>
              </Col>
            </Row>
          </Container>
    )
}

export default Interstitial
