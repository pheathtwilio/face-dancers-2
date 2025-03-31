import DeepgramEvents from '@/util/deepgram-types'
import EventEmitter from 'events'
import EventService from './event-service'
import AvatarEvents from '@/util/avatar-types'
import OpenAI from 'openai'
import { Config } from '@/app/config/config'

class LLMServiceClass extends EventEmitter {

    private static instance: LLMServiceClass
    private openAI: OpenAI | null = null

    private constructor() {
        super()

        EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance) => {
            // get the chat completion for the utterance
            this.completion(utterance)
        })
    }

    // Singleton pattern to ensure a single instance of the LLMService
    public static getInstance(): LLMServiceClass {
        if (!LLMServiceClass.instance) {
        LLMServiceClass.instance = new LLMServiceClass()
        }
        return LLMServiceClass.instance
    }

    private completion = async (utterance: string) => {
        if(!utterance) return

        const response = await fetch('/api/llm-get-chat-completion', {
            method: 'POST',
            headers: { 
                'Connection':'keep-alive',
                'Content-Type':'application/json'
            },
            body: JSON.stringify({ utterance }),
        })

        const data = await response.json()
        EventService.emit(AvatarEvents.AVATAR_SAY, data.item)
    }

}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
