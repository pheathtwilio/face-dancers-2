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

  private constructor() {
    super()
    EventService.on(ConfigEvents.CONFIG_USECASE_GOT, (useCase) => {
      this.useCase = useCase
    })
    EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance) => {
      this.completion(utterance, this.currentEmotion)
    })
    EventService.on(EmotionEvents.EMOTIONS_CURRENT_EMOTION, (emotion) => {
      this.currentEmotion = emotion
    })
  }

  public static getInstance(): LLMServiceClass {
    if (!LLMServiceClass.instance) {
      LLMServiceClass.instance = new LLMServiceClass()
    }
    return LLMServiceClass.instance
  }

  private completion = (utterance: string, currentEmotion: string) => {
    if (!utterance) return

    // Build a query string with our payload
    const params = new URLSearchParams({
      utterance,
      currentEmotion,
      useCase: JSON.stringify(this.useCase)
    }).toString()

    logInfo(`LLMService: opening SSE for “${utterance}” (emotion=${currentEmotion})`)

    // Open the SSE connection
    const es = new EventSource(`/api/llm-get-chat-completion?${params}`)

    es.onmessage = (event) => {
      try {
        const { text } = JSON.parse(event.data)
        logInfo(`LLMService: received snippet → "${text}"`)
        EventService.emit(AvatarEvents.AVATAR_SAY, text)
      } catch (err) {
        logError(`LLMService: failed to parse SSE data: ${err}`)
      }
    }

    es.onerror = (err) => {
      logError(`LLMService SSE error: ${err}`)
      es.close()
    }
  }
}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
