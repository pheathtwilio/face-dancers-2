const { TWILIO_API_KEY, TWILIO_API_SECRET } = process.env

export async function GET(req: Request){

    console.error('GET method not allowed when requesting to update a room')
    return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(req: Request){

    const body = await req.json()
    const { sid } = body

    if (!sid) {
        return new Response(JSON.stringify({error: 'Missing Room SID'}))  
    }

    try {

        const response = await fetch(`https://video.twilio.com/v1/Rooms/${sid}`, {
            method: 'POST',
            headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_API_KEY}:${TWILIO_API_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
            body: new URLSearchParams({ Status: 'completed' }).toString()
        })

        if(!response.ok)
            throw new Error(`Failed to update room status room: ${await response.text()}`)

        return new Response(JSON.stringify({ response: response }), { status: 200 })

    } catch (e) {
      console.error('Error generating room:', e)
      return new Response(JSON.stringify({ error: 'Failed to generate Video Room' }), { status: 500 })
    }

}

