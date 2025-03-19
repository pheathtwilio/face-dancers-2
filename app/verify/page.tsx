'use client'
import { useState, useRef, useEffect } from 'react'
import { Button, Card, Container, Col, Row, Form, Alert, Spinner, Dropdown } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

import * as Sentry from '@sentry/nextjs'


interface CountryData {
  code: string       // E.164 country code (e.g., +1)
  name: string       // Country name
  flag: string       // Flag emoji or code
  digitLength: number // Standard mobile number length (excluding country code)
}


const COUNTRIES: CountryData[] = [
  { code: '+1', name: 'United States', flag: '🇺🇸', digitLength: 10 },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', digitLength: 10 },
  { code: '+61', name: 'Australia', flag: '🇦🇺', digitLength: 9 },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', digitLength: 11 },
  { code: '+33', name: 'France', flag: '🇫🇷', digitLength: 9 },
  { code: '+49', name: 'Germany', flag: '🇩🇪', digitLength: 11 },
  { code: '+91', name: 'India', flag: '🇮🇳', digitLength: 10 },
  { code: '+81', name: 'Japan', flag: '🇯🇵', digitLength: 10 },
  { code: '+39', name: 'Italy', flag: '🇮🇹', digitLength: 10 },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', digitLength: 10 },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', digitLength: 10 },
  { code: '+34', name: 'Spain', flag: '🇪🇸', digitLength: 9 }
]

interface VerificationStartResponse {
  success: boolean
  message?: string
  verification?: {
    sid: string
    status: string
  }
}

interface VerificationCheckResponse {
  success: boolean
  message?: string
  verification_check?: {
    status: string
  }
}

const PhoneVerification: React.FC = () => {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(COUNTRIES[0])
  const [digits, setDigits] = useState<string[]>(Array(COUNTRIES[0].digitLength).fill(''))
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']) // 6-digit code
  const [verificationSid, setVerificationSid] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [verifyMethod, setVerifyMethod] = useState<'sms' | 'call'>('sms')
  const [userName, setUserName] = useState<string>('')
  const searchParams = useRef<URLSearchParams | null>(null)
  
  const digitRefs = useRef<Array<HTMLInputElement | null>>([])
  const codeRefs = useRef<Array<HTMLInputElement | null>>(new Array(6).fill(null))
  const userData = useRef<object | null>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      searchParams.current = new URLSearchParams(window.location.search)
    }
  
    if (searchParams.current) {
      const name = searchParams.current.get('username') || ''
      setUserName(name)
    }
  }, [])

  useEffect(() => {
    setDigits(Array(selectedCountry.digitLength).fill(''))

    digitRefs.current = Array(selectedCountry.digitLength).fill(null)
  }, [selectedCountry])

  const getFullPhoneNumber = (): string => {
    return selectedCountry.code + digits.join('')
  }

  const isNumberAllowed = async (number: string): Promise<boolean> => {

    const response = await fetch('/api/sync-get-allowed-numbers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            phoneNumber: number,
        })
    })

    const payload = await response.json()

    if(payload.success == true){
        userData.current = payload.item.data
        return true
    }

    return false
  }

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value.slice(0, 1) 

    setDigits(newDigits)

    if (value && index < selectedCountry.digitLength - 1) {
      digitRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
  
    const newCode = [...verificationCode]
    newCode[index] = value.slice(0, 1)
    setVerificationCode(newCode)
  
    setTimeout(() => {  
      if (value && index < 5 && codeRefs.current[index + 1]) {
        codeRefs.current[index + 1]?.focus()
      }
    }, 0)
  }

  type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

  const handleKeyDown = (index: number, e: React.KeyboardEvent<FormElement>, type: 'phone' | 'code') => {
    const refs = type === 'phone' ? digitRefs : codeRefs
    const values = type === 'phone' ? digits : verificationCode
    const setValues = type === 'phone' ? setDigits : setVerificationCode
    const maxLength = type === 'phone' ? selectedCountry.digitLength : 6
    
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        refs.current[index - 1]?.focus()
        
        if (e.ctrlKey || e.metaKey) {
          const newValues = [...values]
          newValues[index - 1] = ''
          setValues(newValues)
        }
      }
    }
    
    if (e.key === 'ArrowRight' && index < maxLength - 1) {
      refs.current[index + 1]?.focus()
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country)
  }

  const isPhoneComplete = () => {
    return digits.every(digit => digit !== '')
  }

  const isCodeComplete = () => {
    return verificationCode.every(digit => digit !== '')
  }

  const startVerification = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    const fullPhoneNumber = getFullPhoneNumber()

    const isAllowed = await isNumberAllowed(fullPhoneNumber)
    
    if (!isAllowed) {
      setError('This phone number is not authorized for verification.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/verify-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          channel: verifyMethod,
        }),
      })

      const data: VerificationStartResponse = await response.json()

      if (data.success && data.verification) {
        setVerificationSid(data.verification.sid)
        setSuccess(`Verification ${verifyMethod === 'sms' ? 'code sent' : 'call initiated'}!`)
        setStep('code')
        setTimeout(() => {
          codeRefs.current[0]?.focus()
        }, 100)
      } else {
        setError(data.message || 'Failed to start verification process.')
      }
    } catch (e) {
      setError('An error occurred during the verification process.')
      Sentry.captureMessage(`Verify: Verification Error ${e}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkVerification = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/verify-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: getFullPhoneNumber(),
          code: verificationCode.join(''),
        }),
      })

      const data: VerificationCheckResponse = await response.json()

      if (data.success && data.verification_check?.status === 'approved') {
        setSuccess('Phone number verified successfully!')
        
        // localStorage.setItem('phoneVerified', 'true')

        const response = await fetch('/api/sync-create-session', {
            method: "GET",
        })

        const data = await response.json()

        if(data.success){
            localStorage.setItem('session', JSON.stringify(data.item))
        }else{
          setError(data.message || 'unable to create session')
        }

        setTimeout(() => {
          router.push(`/interstitial?username=${userName}`)
        }, 1500)
      } else {
        setError(data.message || 'Invalid verification code.')
      }
    } catch (e) {
      setError('An error occurred during the verification process.')
      Sentry.captureMessage(`Verify: Verification Error ${e}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent, type: 'phone' | 'code') => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').split('')
    
    if (type === 'phone') {
      const newDigits = [...digits]
      for (let i = 0; i < Math.min(pastedDigits.length, selectedCountry.digitLength); i++) {
        newDigits[i] = pastedDigits[i]
      }
      setDigits(newDigits)
      
      const nextEmptyIndex = newDigits.findIndex(d => d === '')
      if (nextEmptyIndex !== -1) {
        digitRefs.current[nextEmptyIndex]?.focus()
      } else {
        digitRefs.current[selectedCountry.digitLength - 1]?.focus()
      }
    } else {
      const newCode = [...verificationCode]
      for (let i = 0; i < Math.min(pastedDigits.length, 6); i++) {
        newCode[i] = pastedDigits[i]
      }
      setVerificationCode(newCode)
      
      const nextEmptyIndex = newCode.findIndex(d => d === '')
      if (nextEmptyIndex !== -1) {
        codeRefs.current[nextEmptyIndex]?.focus()
      } else {
        codeRefs.current[5]?.focus()
      }
    }
  }

  const setDigitRef = (index: number) => (el: HTMLInputElement | null) => {
    digitRefs.current[index] = el
  }

  const setCodeRef = (index: number) => (el: HTMLInputElement | null) => {
    codeRefs.current[index] = el
  }

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
    <Row className="w-100">
      <Col md={{ span: 6, offset: 3 }}>
        <Card className="p-4 shadow-sm border-0 w-75">
          <Card.Body className="d-flex flex-column gap-3">
            <Row>
              <Col>
                <h1 className="fw-bold text-center">Phone Verification</h1>
              </Col>
            </Row>
            <Row>
              <Col>
                <p className="lead text-muted text-center">
                  {step === 'phone'
                    ? 'Please enter your phone number to verify your identity.'
                    : 'Enter the verification code sent to your phone.'}
                </p>
              </Col>
            </Row>
            {error && (
              <Row>
                <Col>
                  <Alert variant="danger">{error}</Alert>
                </Col>
              </Row>
            )}
            {success && (
              <Row>
                <Col>
                  <Alert variant="success">{success}</Alert>
                </Col>
              </Row>
            )}
            <Form className="d-flex flex-column gap-3">
              {step === 'phone' ? (
                <>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Phone Number</Form.Label>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" style={{ width: '120px', height: '38px' }}>
                              <span>{selectedCountry.flag} {selectedCountry.code}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {COUNTRIES.map((country) => (
                                <Dropdown.Item 
                                  key={country.code} 
                                  onClick={() => handleCountrySelect(country)}
                                  active={country.code === selectedCountry.code}
                                >
                                  {country.flag} {country.name} ({country.code})
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                          <div className="d-flex gap-2 justify-content-start" style={{ maxWidth: 'fit-content' }}>
                          {Array.from({ length: selectedCountry.digitLength }).map((_, index) => (
                            <Form.Control
                              key={`digit-${index}`}
                              ref={setDigitRef(index)}
                              type="text"
                              inputMode="numeric"
                              value={digits[index] || ''}
                              onChange={(e) => handleDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e, 'phone')}
                              onPaste={(e) => handlePaste(e, 'phone')}
                              maxLength={1}
                              style={{
                                width: '40px',
                                height: '40px',
                                fontSize: '18px',
                                textAlign: 'center',
                              }}
                              className="form-control"
                            />
                          ))}
                        </div>
                        </div>
                        <Form.Text className="text-muted">
                          Select your country code and enter your phone number.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Verification Method</Form.Label>
                        <div className="d-flex gap-3">
                          <Form.Check
                            type="radio"
                            label="SMS"
                            name="verifyMethod"
                            checked={verifyMethod === 'sms'}
                            onChange={() => setVerifyMethod('sms')}
                          />
                          <Form.Check
                            type="radio"
                            label="Phone Call"
                            name="verifyMethod"
                            checked={verifyMethod === 'call'}
                            onChange={() => setVerifyMethod('call')}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="text-center">
                      <Button 
                        variant="dark" 
                        onClick={startVerification} 
                        disabled={isLoading || !isPhoneComplete()}
                        className="mt-3"
                        style={{ width: '200px' }}
                      >
                        {isLoading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Sending...
                          </>
                        ) : (
                          `Send ${verifyMethod === 'sms' ? 'Code' : 'Call'}`
                        )}
                      </Button>
                    </Col>
                  </Row>
                </>
              ) : (
                <>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Verification Code</Form.Label>
                        <div className="d-flex justify-content-center gap-2 mb-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <Form.Control
                              key={index}
                              ref={(el) => {
                                if (el) codeRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              value={verificationCode[index] || ""}
                              onChange={(e) => handleCodeChange(index, e.target.value)}
                              maxLength={1}
                              style={{ width: "50px", height: "50px", fontSize: "24px", textAlign: "center" }}
                            />
                          ))}
                        </div>
                        <Form.Text className="text-muted text-center d-block">
                          Enter the 6-digit code sent to {selectedCountry.code} {digits.join('')}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="d-flex justify-content-center gap-3">
                      <Button 
                        variant="outline-dark" 
                        onClick={() => { setStep('phone'); setError(''); setSuccess(''); }}
                        className="mt-3 w-50"
                      >
                        Back
                      </Button>
                      <Button 
                        variant="dark" 
                        onClick={checkVerification} 
                        disabled={isLoading || !isCodeComplete()}
                        className="mt-3 w-50"
                      >
                        {isLoading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Verifying...
                          </>
                        ) : (
                          'Verify Code'
                        )}
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
  )
  
  
}

export default PhoneVerification