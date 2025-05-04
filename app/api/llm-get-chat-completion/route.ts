import OpenAI from 'openai'
import Groq from 'groq-sdk'
import { Redis } from '@upstash/redis'
import { configData } from '@/app/config/config'
import llmTypes from '@/util/llm-types'
import { logInfo, logError } from '@/services/logger-service'


export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const groqClient   = new Groq({ apiKey: process.env.GROQ_API_KEY })

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
}
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};


export async function POST(req: Request) {
  // 0) parse JSON body
  let body: {
    sessionId: string
    utterance: string
    currentEmotion: string
    useCase: { prompt: string }
  }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { sessionId, utterance, currentEmotion, useCase } = body
  if (!sessionId || !utterance || !useCase?.prompt) {
    return new Response('Missing required fields', { status: 400 })
  }

  logInfo(`LLM-Stream POST: session=${sessionId}, utterance="${utterance}", emotion="${currentEmotion}"`)

  // 1) load or initialize history
  const key = `history:${sessionId}`
  let history: ChatMessage[] = []
  let isNewSession = false

  try {
    // Notice we fetch as `any` so we can detect non-string
    const raw: any = await redis.get(key)

    if (raw == null) {
      // brand-new session
      isNewSession = true
      history = [
        { role: 'system', content: useCase.prompt },
        { role: 'system', content: `User feels **${currentEmotion}**—acknowledge you see that.` }
      ]
      await redis.set(key, JSON.stringify(history), { ex: 3600 })
    } else {
      // existing session: handle string vs. already-parsed array
      let parsed: any
      if (typeof raw === 'string') {
        // typical case
        try {
          parsed = JSON.parse(raw)
          if (!Array.isArray(parsed)) {
            throw new Error('parsed value is not an array')
          }
        } catch (parseErr) {
          logError(`Bad JSON in "${key}": ${parseErr}. Keeping existing history, not resetting.`)
          parsed = []  // we’ll start from scratch but not re-inject system prompts
        }
      } else if (Array.isArray(raw)) {
        // someone stored a JS array directly
        parsed = raw
      } else {
        // completely unexpected type
        logError(`Unexpected raw type for "${key}": ${typeof raw}. Ignoring and starting fresh.`)
        parsed = []
      }
      history = parsed
    }
  } catch (err) {
    logError(`Redis GET failed for "${key}": ${err}. Starting fresh history.`)
    history = []
    isNewSession = true
  }

  // 2) append user turn and persist immediately
  history.push({ role: 'user', content: utterance })
  try {
    logInfo(`llm-get-chat-completion-service: USER Utterance is ${utterance} history is ${JSON.stringify(history)}`)
    await redis.set(key, JSON.stringify(history), { ex: 3600 })
  } catch (e) {
    logError(`Failed persisting user turn for ${JSON.stringify(key)}: ${e}`)
  }

  // 3) build messages
  const messages = history

  // 4) open LLM stream
  const llmStream = configData.llm === llmTypes.GROQ
    ? await groqClient.chat.completions.create({
        model:  'llama3-8b-8192',
        stream: true,
        messages: messages as any,
      })
    : await openaiClient.chat.completions.create({
        model:  'gpt-3.5-turbo-1106',
        stream: true,
        messages,
      })

  const sentenceRe = /([^\.!?]+[\.!?])/g
  const encoder    = new TextEncoder()
  let buffer       = ''
  let lastFlush    = 0

  // 5) stream back SSE and persist assistant snippets immediately
  const stream = new ReadableStream({
    async start(controller) {
      if (isNewSession) {
        controller.enqueue(
          encoder.encode(
            `event: new_session\n` +
            `data: ${JSON.stringify({ sessionId })}\n\n`
          )
        )
      }
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

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: snippet })}\n\n`)
            )

            // persist each assistant snippet immediately
            history.push({ role: 'assistant', content: snippet })
            try {
              await redis.set(key, JSON.stringify(history), { ex: 3600 })
            } catch (e) {
              logError(`Failed persisting assistant snippet for ${key}: ${e}`)
            }
          }

          if (lastFlush > 0) {
            buffer = buffer.slice(lastFlush)
            lastFlush = 0
          }
        }

        // any remainder
        const rem = buffer.trim()
        if (rem) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: rem })}\n\n`)
          )
          history.push({ role: 'assistant', content: rem })
          try {
            await redis.set(key, JSON.stringify(history), { ex: 3600 })
          } catch (e) {
            logError(`Failed persisting final snippet for ${key}: ${e}`)
          }
        }

        controller.enqueue(encoder.encode('event: done\ndata: [DONE]\n\n'))
        controller.close()
      } catch (e) {
        logError(`Streaming error: ${e}`)
        controller.error(e)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection:      'keep-alive'
    }
  })
}
