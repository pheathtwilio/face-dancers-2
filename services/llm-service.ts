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

        this.openAI = new OpenAI(
            {
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true
            })

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
        
        const completion = await this.openAI?.chat.completions.create({
            messages: [
                {
                    role: 'system', content: Config.useCase.prompt
                },
                {
                    role: 'user', content: utterance
                }
            ],
            model: 'gpt-4o',
        })

        if(!completion) throw new Error('no completion was created')
        EventService.emit(AvatarEvents.AVATAR_SAY, completion.choices[0].message.content)
    }

}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
