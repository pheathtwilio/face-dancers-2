import DeepgramEvents from '@/util/deepgram-types'
import EventEmitter from 'events'
import EventService from './event-service'
import AvatarEvents from '@/util/avatar-types'
import OpenAI from 'openai'
import Config from '@/app/config/config'

class LLMServiceClass extends EventEmitter {

    private static instance: LLMServiceClass
    private openAI: OpenAI | null = null

    private constructor() {
        super()

        this.openAI = new OpenAI()

        EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance) => {
            // get the chat completion for the utterance
            const completion = this.completion(utterance)

            // emit the completion to the Avatar
            EventService.emit(AvatarEvents.AVATAR_SAY, completion)
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
                    role: 'system', content: Config.prompt
                },
                {
                    role: 'user', content: utterance
                }
            ],
            model: 'gpt-4o',
        })

        if(!completion) throw new Error('no completion was created')
        return completion.choices[0].message.content
    }

}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
