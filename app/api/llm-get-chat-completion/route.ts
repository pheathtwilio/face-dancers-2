import OpenAI from 'openai'
import { configData } from '@/app/config/config'
import Groq from 'groq-sdk'
import llmTypes from '@/util/llm-types'
import { logInfo, logError } from '@/services/logger-service'

export async function GET(req: Request){
  return new Response(JSON.stringify({error: 'GET method not allowed'}), {status: 405})
}

export async function POST(req: Request){

    try{

        const { utterance, useCase, currentEmotion } = await req.json()
        if(!utterance) throw new Error(`No utterance provided to LLM`)

        logInfo(`LLM-Get-Chat-Completion: user said ${utterance} and is feeling ${currentEmotion}`)

        let stream: any = null
        let openai: OpenAI
        let groq: Groq

        switch(configData.llm){
            case llmTypes.OPENAI:
                openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
                stream = await openai!.chat.completions.create({
                    messages: [
                        { role: 'system', content: useCase.prompt }, 
                        { role: 'system', content: `The user is currently feeling **${currentEmotion}.
                                                    Make sure to include their emotion into the way you respond.
                                                    If you do comment on their current emotional state, make sure 
                                                    you tell them that you see or observe that they are in that emotion.
                                                    `},
                        { role: 'user', content: utterance }],
                    model: 'gpt-3.5-turbo-1106',
                    stream: true
                })
                break
            case llmTypes.GROQ:
                groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
                stream = await groq!.chat.completions.create({
                    messages: [ 
                        { role: 'system', content: useCase.prompt }, 
                        { role: 'system', content: `The user is currently feeling **${currentEmotion}.
                                                    Make sure to include their emotion into the way you respond.
                                                    If you do comment on their current emotional state, make sure 
                                                    you tell them that you see or observe that they are in that emotion.
                                                    `},
                        { role: 'user', content: utterance }],
                    model: 'llama3-8b-8192',
                    stream: true
                })
                break
            default:
                openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
                stream = await openai!.chat.completions.create({
                    messages: [
                        { role: 'system', content: useCase.prompt }, 
                        { role: 'system', content: `The user is currently feeling **${currentEmotion}.
                                                    Make sure to include their emotion into the way you respond.
                                                    If you do comment on their current emotional state, make sure 
                                                    you tell them that you see or observe that they are in that emotion.
                                                    `},
                        { role: 'user', content: utterance }],
                    model: 'gpt-3.5-turbo-1106',
                    stream: true
                })
                break
        }

        const completion: string[] = []

        for await (const chunk of stream){
            const content = chunk.choices[0]?.delta?.content || ''
            completion.push(content)
        }

        logInfo(`llm-get-chat-completion: ${completion.join("")}`)
        return new Response(JSON.stringify({ success: true, item: completion.join("") }), {status: 200})

    } catch (e) {
        logError(`llm-get-chat-completion: ${e}`)
        return new Response(JSON.stringify({ success: false, message: e }), {status: 500})
    }

}

export const config = { runtime: 'edge' }