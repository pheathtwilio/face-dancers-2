import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFICATION_SID

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
        return new Response(JSON.stringify({ message: 'phone number and verification code are required' }), { status: 400 })
    }

    const verificationCheck = await client.verify.v2
        .services(VERIFY_SERVICE_SID!)
        .verificationChecks.create({
        to: phoneNumber,
        code,
    })

    return new Response(JSON.stringify({ 
        success: true, 
        verification_check: {
            status: verificationCheck.status,
        } 
    }), { status: 200 })
  
  } catch (e: any) {
    console.error('Twilio verification check error:', e)
    return new Response(JSON.stringify({ 
        success: false,
        message: e.message || 'failed to start verification' 
    }), { status: 500 })
  }
}
