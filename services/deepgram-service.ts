import DeepgramEvents from '@/util/deepgram-types'
import EventService from './event-service'
import EventEmitter from 'events'
import STTEvents from '@/util/stt-types'
import { createClient, DeepgramClient, ListenLiveClient, LiveTranscriptionEvents } from '@deepgram/sdk'

import * as Sentry from '@sentry/nextjs'

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
    private readonly KEEP_ALIVE_INTERVAL = 10000
    private keepAliveInterval: NodeJS.Timeout | null = null
    private options: DeepgramSTTOptions | null = {
        apiKey: '',
        config: {
            language: 'en',
            punctuate: true,
            interimResults: true,
        }
    }

    private constructor() {
        super()
        // this.initialize()

        EventService.on(DeepgramEvents.DEEPGRAM_START_SESSION, () => {
            this.initialize()
        })

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

    

    private startKeepAlive = () => {
        if (this.keepAliveInterval) return // already running
        this.keepAliveInterval = setInterval(() => {
            try {
                if (this.connection && this.connection.getReadyState() === 1) {
                    this.connection.send(JSON.stringify({ type: 'ping' }))
                }
            } catch (err) {
                Sentry.captureMessage(`Deepgram-Service: Keep-alive send error - ${err}`, 'error')
            }
        }, this.KEEP_ALIVE_INTERVAL)
    }

    private stopKeepAlive = () => {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval)
            this.keepAliveInterval = null
        }
    }

    private sendVoiceData = (data: any) => {
        this.connection?.send(data)
    }

    private initialize = async () => {

        Sentry.captureMessage(`Deepgram-Service: Establishing Client`, 'info')

        // get the key and add to options
        const response = await fetch('/api/deepgram-get-key')
        const data = await response.json()
        this.options!.apiKey = data.item

        this.deepgram = createClient(this.options!.apiKey)
        if(!this.deepgram) throw new Error('No Deepgram client was established')

        Sentry.captureMessage(`Deepgram-Service: Establishing Connection`, 'info')
        this.connection = await this.deepgram?.listen.live(this.options?.config)
        if(!this.connection) throw new Error('No Deepgram connection was established')

        Sentry.captureMessage(`Deepgram-Service: Connection State ${this.connection?.getReadyState()}`, 'info')

        this.connection?.on(LiveTranscriptionEvents.Open, () => {
            EventService.off(STTEvents.STT_SEND_SPEECH_DATA, this.sendVoiceData)
            EventService.on(STTEvents.STT_SEND_SPEECH_DATA, this.sendVoiceData)
            this.startKeepAlive()
        })

        let is_finals: string[] = []
        this.connection?.on(LiveTranscriptionEvents.Transcript, (data) => {

            const sentence = data.channel.alternatives[0].transcript

            if(sentence.length == 0) return // ignore empty transcripts

            if(data.is_final){
                //  concatenate the pieces
                is_finals.push(sentence)

                if(data.speech_final){
                    const utterance = is_finals.join(' ')
                    is_finals = []
                    this.sendUtterance(utterance)
                    Sentry.captureMessage(`Deepgram-Service: Utterance - ${sentence}`, 'info')
                }else{
                // good for real-time captioning
                }

            }else{
            // good for real-time captioning
            }
        })

        this.connection?.on(LiveTranscriptionEvents.Close, () => {
            this.stopKeepAlive()
            this.connection?.disconnect()
        })
        this.connection?.on(LiveTranscriptionEvents.Error, (e) => {

            Sentry.captureMessage(`Deepgram-Service: Transcription Event Error ${e}`, 'error')
            this.stopKeepAlive()
            try{
                this.connection?.removeAllListeners()
                this.connection?.disconnect()
            }catch(e){Sentry.captureMessage(`Deepgram-Service: Disconnection Error ${e}`, 'error')}
            
        })

    }

    private sendUtterance = (utterance: string) => {
        EventService.emit(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, utterance)
    }

    private endSession = async () => {
        this.stopKeepAlive()
        await this.connection?.requestClose()
        this.deepgram = null
        EventService.off(STTEvents.STT_SEND_SPEECH_DATA, this.sendVoiceData)
        EventService.off(DeepgramEvents.DEEPGRAM_TRANSCRIPTION_EVENT, this.sendUtterance)
    }

}

const DeepgramService = DeepgramServiceClass.getInstance()
export default DeepgramService
