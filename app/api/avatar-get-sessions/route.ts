import { logError } from "@/services/logger-service"

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY

export async function GET(_req: Request){

    const url = 'https://api.heygen.com/v1/streaming.list'

    if (!HEYGEN_API_KEY) {
      return new Response(JSON.stringify({ error: 'No HEYGEN API ACCESS KEY' }), { status: 500 }) 
    }

    try {

        const response = await fetch(url, {
            method: 'GET', 
            headers: {
                'Accept': 'application/json',
                'x-api-key': HEYGEN_API_KEY
            }
        })

        if(!response.ok){
            throw new Error(`${response.status}`)
        }

        const sessionObject = await response.json()

        let data: object[] = []
        if(!sessionObject.data)
            throw new Error('No data on Sessions Object')

        if(sessionObject.data.sessions.length > 0){
            for(let i=0; i < sessionObject.data.sessions.length; i++){
                data.push(sessionObject.data.sessions[i])
            }
        }

        return new Response(JSON.stringify({ item: data }), { status: 200 })

    } catch (e) {
      logError(`API-Avatar-Get-Sessions: Error getting sessions ${e}`)
      return new Response(JSON.stringify({ error: 'Failed to get sessions' }), { status: 500 })
    }

}

export async function POST(_req: Request){

    logError(`API-Avatar-Get-Sessions: POST method not allowed`)
    return new Response(JSON.stringify({error: 'POST method not allowed'}), {status: 405})

}