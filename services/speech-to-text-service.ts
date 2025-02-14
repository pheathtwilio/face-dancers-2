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

            if(!this.stream) throw new Error('no audio stream is set')
            this.setMediaRecorder(this.stream)
            
            if(!this.mediaRecorder) throw new Error('no media recorder has been instantiated')
            this.initializeEventListeners(this.mediaRecorder)

        })
        
    }

    // Singleton pattern to ensure a single instance of the VideoService
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

    }

    private setMediaRecorder = (stream: MediaStream) => {
        this.mediaRecorder = new MediaRecorder(stream)
    }

    private initializeEventListeners = (mediaRecorder: MediaRecorder) => {

        mediaRecorder.ondataavailable = (event) => {
            EventService.emit(STTEvents.STT_SEND_SPEECH_DATA, event.data)
        }

        mediaRecorder.onstop = () => {
            mediaRecorder.stop()
        }

    }

}

const STTService = STTServiceClass.getInstance()
export default STTService
