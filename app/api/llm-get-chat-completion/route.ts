import OpenAI from 'openai'
import Groq from 'groq-sdk'
import { configData } from '@/app/config/config'
import llmTypes from '@/util/llm-types'
import { logInfo, logError } from '@/services/logger-service'

// export const config = { runtime: 'edge' }

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// instantiate once
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const groqClient   = new Groq({  apiKey: process.env.GROQ_API_KEY  })

export async function GET(req: Request) {
  // try {
    const { searchParams } = new URL(req.url)
    const utterance      = searchParams.get('utterance')      || ''
    const currentEmotion = searchParams.get('currentEmotion') || ''
    const useCaseParam   = searchParams.get('useCase')        || ''

    if (!utterance)      return new Response('Missing `utterance`', { status: 400 })
    if (!useCaseParam)   return new Response('Missing `useCase`',  { status: 400 })

    let useCase: { prompt: string }
    try {
      useCase = JSON.parse(useCaseParam)
    } catch {
      return new Response('Invalid JSON for `useCase`', { status: 400 })
    }

    logInfo(`LLM-Stream GET: utterance="${utterance}" emotion="${currentEmotion}"`)

    const llmStream = configData.llm === llmTypes.GROQ
      ? await groqClient.chat.completions.create({
          model: 'llama3-8b-8192',
          stream: true,
          messages: [
            { role: 'system', content: useCase.prompt },
            { role: 'system', content: `User feels **${currentEmotion}**—acknowledge you see that.` },
            { role: 'user',   content: utterance }
          ]
        })
      : await openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo-1106',
          stream: true,
          messages: [
            { role: 'system', content: useCase.prompt },
            { role: 'system', content: `User feels **${currentEmotion}**—acknowledge you see that.` },
            { role: 'user',   content: utterance }
          ]
        })

    const sentenceRe = /([^\.!\?]+[\.!\?])/g
    const encoder    = new TextEncoder()
    let buffer       = ''
    let lastFlush    = 0

    const stream = new ReadableStream({
      async start(controller) {

        // for the client open
        controller.enqueue(encoder.encode(':\n\n'))

        try {
          for await (const packet of llmStream) {
            const tok = packet.choices[0]?.delta?.content
            if (!tok) continue

            buffer += tok
            sentenceRe.lastIndex = 0

            let match: RegExpExecArray | null
            while ((match = sentenceRe.exec(buffer)) !== null) {
              const snippet = match[0].trim()
              lastFlush = sentenceRe.lastIndex

              // encode each sentence as its own SSE data event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: snippet })}\n\n`)
              )


              // const sse = `data: ${JSON.stringify({ text: snippet.trim() })}\n\n`
              // controller.enqueue(encoder.encode(sse))
            }

            if (lastFlush > 0) {
              buffer = buffer.slice(lastFlush)
              lastFlush = 0
            }
          }

          // flush any trailing text
          if (buffer.trim()) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: buffer.trim() })}\n\n`)
            )
            // const trailing = `data: ${JSON.stringify({ text: buffer.trim() })}\n\n`
            // controller.enqueue(encoder.encode(trailing))
          }
          // controller.close()

          // send a DONE marker
          controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`))
          controller.close()


        } catch (e) {
          logError(`Streaming error: ${e}`)
          controller.error(e)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type':   'text/event-stream; charset=utf-8',
        'Cache-Control':  'no-cache, no-transform',
        Connection:       'keep-alive'
      }
    })

  // } catch (err) {
  //   logError(`LLM-GET-chat-completion error: ${err}`)
  //   return new Response(null, { status: 500 })
  // }
}
