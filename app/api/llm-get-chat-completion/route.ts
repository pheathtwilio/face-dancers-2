import OpenAI from 'openai'
import { Config } from '@/app/config/config'
import { ChatCompletionMessageParam } from 'openai/resources'
import Groq from 'groq-sdk'

const baseMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: Config.useCase.prompt }
]

export async function GET(req: Request){
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})
}

export async function POST(req: Request){

    try{

        const { utterance } = await req.json()
        if(!utterance) throw new Error(`No utterance provided to LLM`)

        if(Config.llm === 'openai'){
            const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

            const completion = await openai!.chat.completions.create({
                messages: [...baseMessages, { role: 'user', content: utterance }],
                model: 'gpt-3.5-turbo-1106',
            })

            return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const completion = await groq!.chat.completions.create({
            messages: [ { role: 'system', content: Config.useCase.prompt }, { role: 'user', content: utterance }],
            model: 'llama3-8b-8192',
        })
    
        return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})

    } catch (e) {
        console.log(`ERROR ${e}`)
      return new Response(JSON.stringify({ success: false, message: e }), {status: 500})
    }

}

export const config = { runtime: 'edge' }