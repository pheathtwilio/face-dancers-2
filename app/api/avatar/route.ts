import * as Sentry from '@sentry/nextjs'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY

export async function GET(_req: Request){

  Sentry.captureMessage(`API-Avatar: GET method not allowed when requesting JWT token`, 'error')
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(_req: Request){

    if (!HEYGEN_API_KEY) {
      return new Response(JSON.stringify({ error: 'No HEYGEN API ACCESS KEY' }), { status: 200 }) 
    }

    try {

        const response = await fetch(
            'https://api.heygen.com/v1/streaming.create_token',
            {
                method: 'POST',
                headers: {
                  'x-api-key': HEYGEN_API_KEY,    
                },
            },
        )
        const wallet = await response.json();

        return new Response(JSON.stringify({ token: wallet.data.token }), { status: 200 })

    } catch (e) {
      Sentry.captureMessage(`API-Avatar: Error generating token ${e}`, 'error')
      return new Response(JSON.stringify({ error: 'Failed to retrieve HEYGEN token' }), { status: 500 })
    }

}
