import * as Twilio from 'twilio'
import * as Sentry from '@sentry/nextjs'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env

export async function GET(req: Request){

  Sentry.captureMessage(`API-Twilio-Video-Token: GET method not allowed when requesting JWT token`, 'error')
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(req: Request){

    const body = await req.json()
    const { userName, roomName } = body

    if (!userName || !roomName) {
      return new Response(JSON.stringify({error: 'Missing username or roomName'}))  
    }

    try {

      const token = new Twilio.jwt.AccessToken(
        TWILIO_ACCOUNT_SID!,
        TWILIO_API_KEY!,
        TWILIO_API_SECRET!,
        {identity: (userName)}
      )

      const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({
        room: roomName,
      })

      token.addGrant(videoGrant)

      return new Response(JSON.stringify({ token: token.toJwt() }), { status: 200 })

    } catch (e) {
      Sentry.captureMessage(`API-Twilio-Video-Token: Error generating token ${e}`, 'error')
      return new Response(JSON.stringify({ error: 'Failed to generate Twilio token' }), { status: 500 })
    }

}

