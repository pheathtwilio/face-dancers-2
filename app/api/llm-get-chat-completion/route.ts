import OpenAI from 'openai'
import { configData, UseCase } from '@/app/config/config'
import { ChatCompletionMessageParam } from 'openai/resources'
import Groq from 'groq-sdk'


export async function GET(req: Request){
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})
}

export async function POST(req: Request){

    try{

        const { utterance, useCase } = await req.json()
        if(!utterance) throw new Error(`No utterance provided to LLM`)

        if(configData.llm === 'openai'){

            

            const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

            const completion = await openai!.chat.completions.create({
                messages: [{ role: 'system', content: useCase.prompt }, { role: 'user', content: utterance }],
                model: 'gpt-3.5-turbo-1106',
            })

            return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const completion = await groq!.chat.completions.create({
            messages: [ { role: 'system', content: useCase.prompt }, { role: 'user', content: utterance }],
            model: 'llama3-8b-8192',
        })
    
        return new Response(JSON.stringify({ success: true, item: completion.choices[0].message.content }), {status: 200})

    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e }), {status: 500})
    }

}

export const config = { runtime: 'edge' }