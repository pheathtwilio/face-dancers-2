import DeepgramEvents from '@/util/deepgram-types'
import EventEmitter from 'events'
import EventService from './event-service'
import AvatarEvents from '@/util/avatar-types'
import { configData } from '@/app/config/config'
import type { UseCase } from '@/app/config/config'
import ConfigEvents from '@/util/config-types'
import llmTypes from '@/util/llm-types'
import { logInfo, logError } from '@/services/logger-service'
import { EmotionEvents, EmotionTypes } from '@/util/emotion-types'

class LLMServiceClass extends EventEmitter {
  private static instance: LLMServiceClass
  private useCase: UseCase = configData.useCase
  private currentEmotion: string = EmotionTypes.EMOTIONS_DEFAULT_EMOTION
  private sessionId!: string
  private isStreaming = false

  private constructor() {
    super()
    this.initializeSession()

    EventService.on(ConfigEvents.CONFIG_USECASE_GOT, (useCase) => {
      this.useCase = useCase
    })

    // Trigger only on final transcripts if your Deepgram event supplies that flag:
    EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance: string, isFinal?: boolean) => {
      if (!utterance || (typeof isFinal === 'boolean' && !isFinal)) return
      this.completion(utterance, this.currentEmotion)
    })

    EventService.on(EmotionEvents.EMOTIONS_CURRENT_EMOTION, (emotion) => {
      this.currentEmotion = emotion
    })

    EventService.on(llmTypes.LLM_SESSION_ENDED, () => {
      this.destroySession()
    })
  }

  public static getInstance(): LLMServiceClass {
    if (!LLMServiceClass.instance) {
      LLMServiceClass.instance = new LLMServiceClass()
    }
    return LLMServiceClass.instance
  }

  private async initializeSession() {
    await this.getOrCreateSessionId()
  }

  private async getOrCreateSessionId() {
    const res = await fetch('/api/upstash-get-session', { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Session API failed: ${res.status}`)
    }
    const { sessionId } = await res.json()
    this.sessionId = sessionId
  }
  
  private async destroySession() {
    try {
      const res = await fetch('/api/upstash-delete-session', {
        method:  'DELETE',
        cache:   'no-store'
      })
      if (!res.ok) {
        throw new Error(`Session DELETE failed (${res.status})`)
      }

      await this.getOrCreateSessionId()

      logInfo(`LLM-Service: session reset to ${this.sessionId}`)
    } catch (e) {
      logError(`LLM-Service: failed to reset session: ${e}`)
    }
  }

  private async completion(utterance: string, currentEmotion: string) {
    if (this.isStreaming) {
      logInfo('LLM-Service: already streaming ignoring new utterance')
      return
    }
    if (!this.sessionId) {
      throw new Error('LLM-Service: no session ID set')
    }
    this.isStreaming = true

    const payload = {
      sessionId: this.sessionId,
      utterance,
      currentEmotion,
      useCase: this.useCase,
    }

    let response: Response
    try {
      response = await fetch('/api/llm-get-chat-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      logError(`LLM-Service: fetch failed: ${err}`)
      this.isStreaming = false
      return
    }

    if (!response.ok || !response.body) {
      logError(`LLM-Service: SSE request failed: ${response.status}`)
      this.isStreaming = false
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const dispatch = (chunk: string) => {
      if (chunk.startsWith('event: new_session')) {
        const dataLine = chunk.split('\n').find(l => l.startsWith('data: '))
        if (dataLine) {
          try {
            const { sessionId: newId } = JSON.parse(dataLine.slice(6))
            this.sessionId = newId
            localStorage.setItem('SessionId', newId)
            logInfo(`LLM-Service: server reset session to ${newId}`)
          } catch (err) {
            logError(`LLM-Service: malformed new_session chunk: ${err}`)
          }
        }
      } else if (chunk.startsWith('data:')) {
        const json = chunk.slice(5).trim()
        try {
          const { text } = JSON.parse(json)
          EventService.emit(AvatarEvents.AVATAR_SAY, text)
        } catch (err) {
          logError(`LLM-Service: failed to parse data chunk: ${err}`)
        }
      }
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 2)
          dispatch(chunk)
        }
      }
    } catch (err) {
      logError(`LLM-Service: stream read error: ${err}`)
    } finally {
      this.isStreaming = false
    }
  }
}

export default LLMServiceClass.getInstance()
