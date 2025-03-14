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
    private connection: ListenLiveClient | undefined = undefined
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

        console.log('deepgram-service - establishing client')
        this.deepgram = createClient(this.options?.apiKey)
        if(!this.deepgram) throw new Error('No Deepgram client was established')

        console.log('deepgram-service - establishing connection')
        this.connection = await this.deepgram?.listen.live(this.options?.config)
        if(!this.connection) throw new Error('No Deepgram connection was established')

        this.connection?.on(LiveTranscriptionEvents.Open, () => {

            // register listeners from STT
            EventService.on(STTEvents.STT_SEND_SPEECH_DATA, (data) => {
                this.connection?.send(data)
            })

        })

        let is_finals: string[] = []
        this.connection?.on(LiveTranscriptionEvents.Transcript, (data) => {
            const sentence = data.channel.alternatives[0].transcript

            console.log(`deepgram-service - transcription: ${sentence}`)

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

        this.connection?.on(LiveTranscriptionEvents.Close, () => {this.connection?.disconnect()})
        this.connection?.on(LiveTranscriptionEvents.Error, (e) => {

            console.error(e)
            try{
                this.connection?.removeAllListeners()
                this.connection?.disconnect()
            }catch(e){console.error(e)}
            
        })

    }

    private endSession = () => {

    }

}

const DeepgramService = DeepgramServiceClass.getInstance()
export default DeepgramService
