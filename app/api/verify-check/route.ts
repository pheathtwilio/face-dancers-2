import twilio from 'twilio'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {accountSid: TWILIO_ACCOUNT_SID})

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
