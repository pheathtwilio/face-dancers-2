const { TWILIO_API_KEY, TWILIO_API_SECRET } = process.env

export async function GET(req: Request){

    try {

        const response = await fetch('https://video.twilio.com/v1/Rooms', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${TWILIO_API_KEY}:${TWILIO_API_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        if(!response.ok)
            throw new Error(`Failed to list rooms: ${await response.text()}`)

        const rooms = await response.json()
        return new Response(JSON.stringify({ rooms: rooms }), { status: 200 })
    
    }catch(e){
        console.error('Error listing rooms:', e)
        return new Response(JSON.stringify({ error: 'Failed to list Video Rooms' }), { status: 500 })
    }

}

export async function POST(req: Request){
    console.error('POST method not allowed when requesting to list a room')
    return new Response(JSON.stringify({error: 'POST method not allowed'}), {status: 405})
}

