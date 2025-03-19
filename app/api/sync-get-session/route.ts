import twilio from 'twilio'
import { v4 as uuidv4 } from 'uuid'

import * as Sentry from '@sentry/nextjs'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {accountSid: TWILIO_ACCOUNT_SID})

const SYNC_SERVICE_SID = process.env.TWILIO_SYNC_SID
const SYNC_MAP_SID = process.env.TWILIO_SYNC_MAP_SESSIONS_SID

export async function POST(request: Request) {

  try {

    const { sessionId } = await request.json()

    if(!sessionId) throw new Error('No Session ID was given')
  
    try {

        const sessionId = uuidv4()
        const syncMapItem = await client.sync.v1
        .services(SYNC_SERVICE_SID!)
        .syncMaps(SYNC_MAP_SID!)
        .syncMapItems(sessionId)
        .fetch()

        return new Response(JSON.stringify({ success: true, item: syncMapItem }), {status: 200})
                                
    }catch(e){

        return new Response(JSON.stringify({ success: false, message: e }), {status: 200})
    }

  
  } catch (e) {
    Sentry.captureMessage(`API-Sync-Get-Session: Twilio Sync Error ${e}`, 'error')
    return new Response(JSON.stringify({ message: e || 'failed to check sync' }), { status: 500 })
  }

}
