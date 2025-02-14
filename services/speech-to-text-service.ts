import STTEvents from '@/util/stt-types'
import EventService from './event-service'
import EventEmitter from 'events'

class STTServiceClass extends EventEmitter {

    private static instance: STTServiceClass

    private audioDeviceId: string | null = null
    private stream: MediaStream | null = null
    private mediaRecorder: MediaRecorder | null = null

    private constructor() {
        super()

        EventService.on(STTEvents.STT_ATTACH_AUDIO_TRACK, (audioDeviceId) => {
            
            if(!audioDeviceId) throw new Error('no audio device id has been passed')
            this.audioDeviceId = audioDeviceId
            this.setStreamByAudioDeviceId(audioDeviceId)

        })

        EventService.on(STTEvents.STT_END_SESSION, () => {
            this.endSession()
        })
        
    }

    // Singleton pattern to ensure a single instance of the STTService
    public static getInstance(): STTServiceClass {
        if (!STTServiceClass.instance) {
            STTServiceClass.instance = new STTServiceClass()
        }
        return STTServiceClass.instance
    }

    private setStreamByAudioDeviceId = async (audioDeviceId: string) => {

        const constraints = {
            audio: { deviceId: audioDeviceId }
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints)

        this.mediaRecorder = new MediaRecorder(this.stream)

        this.mediaRecorder.start(500)

        this.mediaRecorder.ondataavailable = (event) => {
            EventService.emit(STTEvents.STT_SEND_SPEECH_DATA, event.data)
        }

        this.mediaRecorder.onstop = () => {
            console.log(`STOPPING MEDIA RECORDER`)
            this.mediaRecorder?.stop()
        }

        this.mediaRecorder.onerror = (e) => {console.error(e)}

    }

    private endSession = () => {
        if(this.mediaRecorder){
            this.mediaRecorder.stop()
        }
    }

    // private setMediaRecorder = (stream: MediaStream) => {
    //     this.mediaRecorder = new MediaRecorder(stream)
    // }

    // private initializeEventListeners = (mediaRecorder: MediaRecorder) => {

    //     console.log(`INITIALIZING ${mediaRecorder}`)

    //     mediaRecorder.ondataavailable = (event) => {
    //         console.log(`DATA AVAILABLE ${event}`)
    //         EventService.emit(STTEvents.STT_SEND_SPEECH_DATA, event.data)
    //     }

    //     mediaRecorder.onstop = () => {
    //         mediaRecorder.stop()
    //     }

    // }

}

const STTService = STTServiceClass.getInstance()
export default STTService
