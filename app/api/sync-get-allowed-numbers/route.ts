import twilio from 'twilio'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {accountSid: TWILIO_ACCOUNT_SID})

const SYNC_SERVICE_SID = process.env.TWILIO_SYNC_SID
const SYNC_MAP_SID = process.env.TWILIO_SYNC_MAP_NUMBERS_SID

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
        return new Response(JSON.stringify({ message: 'phone number is required' }), { status: 400 })
    }

    try {

        const syncMapItem = await client.sync.v1
        .services(SYNC_SERVICE_SID!)
        .syncMaps(SYNC_MAP_SID!)
        .syncMapItems(phoneNumber)
        .fetch()

        return new Response(JSON.stringify({ success: true, item: syncMapItem }), {status: 200})

    }catch(e){
        return new Response(JSON.stringify({ success: false, error: e}), {status: 200})
    }
    
    

  
  } catch (e) {
    console.error('Twilio sync error:', e)
    return new Response(JSON.stringify({ message: e || 'failed to check sync' }), { status: 500 })
  }
}
