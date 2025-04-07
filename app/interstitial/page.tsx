'use client'
import { useState, useRef, useEffect } from 'react'
import { Button, Card, Container, Col, Row, Dropdown, Form } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { usecases } from '@/app/config/config' // Adjust the import path
import ConfigEvents from '@/util/config-types'
import EventService from '@/services/event-service'

const Interstitial: React.FC = () => {
    const router = useRouter()
    const [selectedUseCase, setSelectedUseCase] = useState(usecases.collection[0])
    const [userName, setUserName] = useState<string>('')
    const selectedAudioDeviceRef = useRef<string | ''>('')
    const selectedVideoDeviceRef = useRef<string | ''>('')
    const searchParams = useRef<URLSearchParams | null>(null)

    useEffect(() => {

      if(typeof window !== 'undefined'){
        searchParams.current = new URLSearchParams(window.location.search)
      }
    
      if(searchParams.current){
        setUserName(searchParams.current.get('username') || '')
        selectedAudioDeviceRef.current = searchParams.current.get('microphone') || ''
        selectedVideoDeviceRef.current = searchParams.current.get('video') || ''
      }

    }, [searchParams])

    const handleSelectUseCase = (index: number) => {
        EventService.emit(ConfigEvents.CONFIG_SET_USECASE, (usecases.collection[index]))
        setSelectedUseCase(usecases.collection[index])
    }

    const handleInputChange = (field: keyof typeof selectedUseCase, value: string) => {
        setSelectedUseCase((prev) => ({ ...prev, [field]: value }))
    }

    const handleEnter = () => {
        EventService.emit(ConfigEvents.CONFIG_SET_USECASE, (selectedUseCase))
        router.push(`/waiting-room?username=${userName}&microphone=${selectedAudioDeviceRef.current}&video=${selectedVideoDeviceRef.current}`)
    }

    return (
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Row className="w-100">
          <Col md={{ span: 6, offset: 3 }}> {/* Centered column */}
            <Card className="p-4 shadow-sm border-0 w-100">
              <Card.Body className="d-flex flex-column gap-3">
                <h1 className="fw-bold text-center">Use Case</h1>
                <p className="lead text-muted text-center">
                  Please select your use case.
                </p>

                {/* Dropdown Selector */}
                <Dropdown className="mb-3">
                  <Dropdown.Toggle variant="dark" className="w-100">
                    {selectedUseCase.name}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {usecases.collection.map((useCase, index) => (
                      <Dropdown.Item key={index} onClick={() => handleSelectUseCase(index)}>
                        {useCase.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Form className="d-flex flex-column gap-3">
                  <Form.Group>
                    <Form.Label className="text-start w-100 fw-semibold">Use Case Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedUseCase.name} 
                      readOnly 
                      className="w-100 bg-light"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="text-start w-100 fw-semibold">Avatar</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedUseCase.avatar_name} 
                      readOnly 
                      className="w-100 bg-light"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="text-start w-100 fw-semibold">Greeting</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedUseCase.greeting} 
                      onChange={(e) => handleInputChange('greeting', e.target.value)}
                      className="w-100"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="text-start w-100 fw-semibold">Prompt</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={6} 
                      value={selectedUseCase.prompt} 
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      className="w-100"
                    />
                  </Form.Group>
                </Form>

                <Button variant="dark" onClick={handleEnter} className="mt-3 w-100 btn-lg">
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
