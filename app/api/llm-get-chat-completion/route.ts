import OpenAI from 'openai'
import * as Sentry from '@sentry/nextjs'
import { Config } from '@/app/config/config'

let openAI: OpenAI | null = null

const initialize = () => {
    if(!openAI){
        const API_KEY = process.env.OPENAI_API_KEY

        if(!API_KEY) throw new Error(`No API key set for OpenAI`)

        openAI = new OpenAI({
            apiKey: API_KEY,
        })
    } 
}

export async function GET(req: Request){

  Sentry.captureMessage(`API-LLM-Get-Chat-Completion: GET method not allowed`, 'error')
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})

}

export async function POST(req: Request){

    try{
        initialize()
        const body = await req.json()
        const { utterance } = body

        const completion = await openAI!.chat.completions.create({
            messages: [
                {
                    role: 'system', content: Config.useCase.prompt
                },
                {
                    role: 'user', content: utterance
                }
            ],
            model: 'gpt-4o',
        })
   
        return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})

    } catch (e) {
      Sentry.captureMessage(`API-Twilio-Video-Token: Error generating token ${e}`, 'error')
      return new Response(JSON.stringify({ success: false, message: e }), {status: 500})
    }

}