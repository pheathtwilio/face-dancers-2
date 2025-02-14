import DeepgramEvents from '@/util/deepgram-types'
import EventEmitter from 'events'
import EventService from './event-service'

class LLMServiceClass extends EventEmitter {

    private static instance: LLMServiceClass

    private constructor() {
        super()

        EventService.on(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, (utterance) => {
            // get the chat completion for the utterance

            // emit the utterance to the Avatar
        })
    }

    // Singleton pattern to ensure a single instance of the VideoService
    public static getInstance(): LLMServiceClass {
        if (!LLMServiceClass.instance) {
        LLMServiceClass.instance = new LLMServiceClass()
        }
        return LLMServiceClass.instance
    }


    public endSession = async () => {

    }


}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
