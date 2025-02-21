import DeepgramEvents from '@/util/deepgram-types'
import EventService from './event-service'
import EventEmitter from 'events'
import STTEvents from '@/util/stt-types'
import { createClient, DeepgramClient, ListenLiveClient, LiveTranscriptionEvents } from '@deepgram/sdk'

type DeepgramSTTOptions = {
    apiKey: string
    config: {
        language?: string
        punctuate?: boolean
        interimResults?: boolean
    }
}

class DeepgramServiceClass extends EventEmitter {

    private static instance: DeepgramServiceClass
    private deepgram: DeepgramClient | null = null
    private client: ListenLiveClient | undefined = undefined
    private options: DeepgramSTTOptions | null = {
        apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || 'undefined',
        config: {
            language: 'en',
            punctuate: true,
            interimResults: true,
        }
    }

    private constructor() {
        super()
        this.initialize()

        EventService.on(DeepgramEvents.DEEPGRAM_END_SESSION, () => {
            this.endSession()
        })
        
    }

    // Singleton pattern to ensure a single instance of the VideoService
    public static getInstance(): DeepgramServiceClass {
        if (!DeepgramServiceClass.instance) {
            DeepgramServiceClass.instance = new DeepgramServiceClass()
        }
        return DeepgramServiceClass.instance
    }

    private initialize = async () => {

        this.deepgram = createClient(this.options?.apiKey)
        this.client = await this.deepgram?.listen.live(this.options?.config)

        this.client?.on(LiveTranscriptionEvents.Open, () => {

            // register listeners from STT
            EventService.on(STTEvents.STT_SEND_SPEECH_DATA, (data) => {
                this.client?.send(data)
            })

        })

        let is_finals: string[] = []
        this.client?.on(LiveTranscriptionEvents.Transcript, (data) => {
            const sentence = data.channel.alternatives[0].transcript

            if(sentence.length == 0) return // ignore empty transcripts

            if(data.is_final){
                //  concatenate the pieces
                is_finals.push(sentence)

                if(data.speech_final){
                    const utterance = is_finals.join(' ')
                    is_finals = []
                    EventService.emit(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, utterance)
                }else{
                // good for real-time captioning
                }

            }else{
            // good for real-time captioning
            }
        })

        this.client?.on(LiveTranscriptionEvents.Close, () => {this.client?.disconnect()})
        this.client?.on(LiveTranscriptionEvents.Error, (e) => {console.error(e); this.client?.disconnect()})

    }

    private endSession = () => {

    }

}

const DeepgramService = DeepgramServiceClass.getInstance()
export default DeepgramService
