import { logError } from "@/services/logger-service"

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

export async function GET(_req: Request){

    if(!DEEPGRAM_API_KEY) throw new Error(`Deepgram-Get-Key: No Deepgram API Key`)

    try {

        return new Response(JSON.stringify({ item: DEEPGRAM_API_KEY }), { status: 200 })

    } catch (e) {
      logError(`Deepgram-Get-Key: Error getting Deepgram API Key ${e}`)
      return new Response(JSON.stringify({ error: 'Failed to get deepgram API key' }), { status: 500 })
    }

}

export async function POST(_req: Request){

    logError(`Deepgram-get-key: POST method not allowed`)
    return new Response(JSON.stringify({error: 'POST method not allowed'}), {status: 405})

}