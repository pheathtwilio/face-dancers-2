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

            console.log(`speech-to-text-service - attaching audio track for ${audioDeviceId}`)
            
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

        let audioContext = new window.AudioContext 
        if(audioContext.state === 'suspended' || audioContext.state === 'closed'){
            await audioContext.resume()
            console.log('Audio Context Resumed')
        }

        const constraints = {
            audio: { deviceId: audioDeviceId }
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints)

        if(this.mediaRecorder){
            this.mediaRecorder.stop()       
            this.mediaRecorder = null
        }
        this.mediaRecorder = new MediaRecorder(this.stream)

        this.mediaRecorder.start(500)

        this.mediaRecorder.ondataavailable = (event) => {
            EventService.emit(STTEvents.STT_SEND_SPEECH_DATA, event.data)
        }

        this.mediaRecorder.onstop = () => {
            this.mediaRecorder?.stop()
        }

        this.mediaRecorder.onerror = (e) => {console.error(e)}

    }

    private sendSpeechData = (data: any) => {
        EventService.emit(STTEvents.STT_SEND_SPEECH_DATA, data)
    }

    private endSession = () => {
        if(this.mediaRecorder){
            this.mediaRecorder.stop()
            this.mediaRecorder = null
        }
        EventService.off(STTEvents.STT_SEND_SPEECH_DATA, this.sendSpeechData)
    }

}

const STTService = STTServiceClass.getInstance()
export default STTService
