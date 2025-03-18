import twilio from 'twilio'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {accountSid: TWILIO_ACCOUNT_SID})

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFICATION_SID

export async function POST(request: Request) {
  try {
    const { phoneNumber, channel } = await request.json()

    if (!phoneNumber) {
        return new Response(JSON.stringify({ message: 'phone number is required' }), { status: 400 })
    }

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phoneNumber,
        channel: channel || 'sms',
      })

    return new Response(JSON.stringify({ 
        success: true, 
        verification: {
            sid: verification.sid,
            status: verification.status,
        } 
    }), { status: 200 })
  
  } catch (e: any) {
    console.error('Twilio verification start error:', e)
    return new Response(JSON.stringify({ message: e.message || 'failed to start verification' }), { status: 500 })
  }
}
