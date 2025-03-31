import OpenAI from 'openai'
import { Config } from '@/app/config/config'
import { ChatCompletionMessageParam } from 'openai/resources'

const baseMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: Config.useCase.prompt }
]

export async function GET(req: Request){
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})
}

export async function POST(req: Request){

    try{

        const { messages } = await req.json()
        if(!messages) throw new Error(`No utterance provided to LLM`)

        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

        const completion = await openai!.chat.completions.create({
            messages: [...baseMessages, { role: 'user', content: messages }],
            model: 'gpt-3.5-turbo-1106',
        })
   
        return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})

    } catch (e) {
        console.log(`ERROR ${e}`)
      return new Response(JSON.stringify({ success: false, message: e }), {status: 500})
    }

}