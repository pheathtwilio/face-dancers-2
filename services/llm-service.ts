import DeepgramEvents from '@/util/deepgram-types'
import EventEmitter from 'events'
import EventService from './event-service'
import AvatarEvents from '@/util/avatar-types'
import OpenAI from 'openai'
import { configData } from '@/app/config/config'
import type { UseCase } from '@/app/config/config'
import ConfigEvents from '@/util/config-types'
import llmTypes from '@/util/llm-types'
import { logInfo, logError } from '@/services/logger-service'
import { EmotionEvents, EmotionTypes } from '@/util/emotion-types'

class LLMServiceClass extends EventEmitter {

    private static instance: LLMServiceClass
    private openAI: OpenAI | null = null
    private useCase: UseCase = configData.useCase
    private currentEmotion: string | ''

    private constructor() {
        super()

        this.currentEmotion = EmotionTypes.EMOTIONS_DEFAULT_EMOTION

        EventService.on(ConfigEvents.CONFIG_USECASE_GOT, (useCase: UseCase) => {
            this.useCase = useCase
        })

        EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance) => {
            // get the chat completion for the utterance
            this.completion(utterance, this.currentEmotion)
        })

        EventService.on(llmTypes.LLM_INTERRUPT, () => {
            logInfo(`LLM-SERVICE: INTERRUPT`)
        })

        EventService.on(EmotionEvents.EMOTIONS_CURRENT_EMOTION, (emotion: string) => {
            this.currentEmotion = emotion
        })
    }

    // Singleton pattern to ensure a single instance of the LLMService
    public static getInstance(): LLMServiceClass {
        if (!LLMServiceClass.instance) {
        LLMServiceClass.instance = new LLMServiceClass()
        }
        return LLMServiceClass.instance
    }

    private completion = async (utterance: string, currentEmotion: string) => {
        if(!utterance) return

        const useCase = this.useCase

        const response = await fetch('/api/llm-get-chat-completion', {
            method: 'POST',
            headers: { 
                'Connection':'keep-alive',
                'Content-Type':'application/json'
            },
            body: JSON.stringify({ utterance, useCase, currentEmotion }),
        })

        const data = await response.json()
        EventService.emit(AvatarEvents.AVATAR_SAY, data.item)
    }

}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
