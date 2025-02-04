import { VideoEvents, VideoRoomParameters } from '@/util/video-types'
import * as Twilio from 'twilio'

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET } = process.env

export async function GET(req: Request){

    console.error('GET method not allowed when requesting to create a room')
    return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(req: Request){

    const body = await req.json()
    const { UniqueName, EmptyRoomTimeout } = body

    if (!UniqueName) {
        return new Response(JSON.stringify({error: 'Missing Room Preferences'}))  
    }

    try {

        const response = await fetch('https://video.twilio.com/v1/Rooms', {
            method: 'POST',
            headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_API_KEY}:${TWILIO_API_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
            body: new URLSearchParams({ UniqueName: UniqueName, EmptyRoomTimeout: EmptyRoomTimeout }).toString()
        })

        if(!response.ok)
            throw new Error(`Failed to create room: ${await response.text()}`)

        const roomData = await response.json()

        console.log(`ROOMDATA: ${JSON.stringify(roomData)}`)
        console.log(VideoEvents.VIDEO_ROOM_CREATED)
        return new Response(JSON.stringify({ room: roomData }), { status: 200 })

    } catch (e) {
      console.error('Error generating room:', e)
      return new Response(JSON.stringify({ error: 'Failed to generate Video Room' }), { status: 500 })
    }

}

