import * as Sentry from '@sentry/nextjs'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY


export async function GET(_req: Request){

    Sentry.captureMessage(`API-Avatar-Close-Sessions: GET method not allowed`, 'error')
    return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(_req: Request){

    const url = 'https://api.heygen.com/v1/streaming.stop'

    const { id } = await _req.json()

    if (!HEYGEN_API_KEY) {
      return new Response(JSON.stringify({ error: 'No HEYGEN API ACCESS KEY' }), { status: 500 }) 
    }

    if (!id){
        return new Response(JSON.stringify({ error: 'No ID submitted' }), { status: 500 }) 
    }

    try {

        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Accept': 'application/json',
                'Content-Type':'application/json',
                'x-api-key': HEYGEN_API_KEY
            },
            body: JSON.stringify({ session_id: id})
        })

        if(!response.ok){
            throw new Error(`${response.status}`)
        }

        const data = await response.json()
        Sentry.captureMessage(`Avatar-Service: Capturing close session data ${data}`, 'info')
        return new Response(JSON.stringify({ item: data }), { status: 200 })

    } catch (e) {
      Sentry.captureMessage(`API-Avatar-Close-Sessions: Error closing session ${e}`, 'error')
      return new Response(JSON.stringify({ error: 'Failed to close session' }), { status: 500 })
    }

}
