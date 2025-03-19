import twilio from 'twilio'
import { v4 as uuidv4 } from 'uuid'
import SessionTypes from '@/util/session-types'

import * as Sentry from '@sentry/nextjs'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {accountSid: TWILIO_ACCOUNT_SID})

const SYNC_SERVICE_SID = process.env.TWILIO_SYNC_SID
const SYNC_MAP_SID = process.env.TWILIO_SYNC_MAP_SESSIONS_SID

export async function GET(request: Request) {

  try {
  
    try {

        const sessionId = uuidv4()
        const syncMapItem = await client.sync.v1
        .services(SYNC_SERVICE_SID!)
        .syncMaps(SYNC_MAP_SID!)
        .syncMapItems.create({
            key: sessionId,
            data: { createdAt: Date.now(), isActive: true},
            itemTtl: SessionTypes.ITEM_TTL,
        })

        return new Response(JSON.stringify({ success: true, item: syncMapItem }), {status: 200})
                                
    }catch(e){

        return new Response(JSON.stringify({ success: false, message: e }), {status: 200})
    }

  
  } catch (e) {
    Sentry.captureMessage(`API-Sync-Create-Session: Twilio Sync Error ${e}`, 'error')
    return new Response(JSON.stringify({ message: e || 'failed to check sync' }), { status: 500 })
  }

}
