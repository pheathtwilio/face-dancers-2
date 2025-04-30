import EventService from './event-service'
import EventEmitter from 'events'

import { Rekognition } from 'aws-sdk'

import { logInfo, logError } from '@/services/logger-service'

import { VideoEvents } from '@/util/video-types'
import { EmotionEvents } from '@/util/emotion-types'

interface EmotionObjectInterface {
    isSet: boolean
    html: HTMLDivElement | null
    canvas: HTMLCanvasElement | null
    imageBlob: Blob | null
    emotions: (string | undefined)[]
}

const TIME_SLICE = 1000 // ms

class EmotionServiceClass extends EventEmitter {

    private static instance: EmotionServiceClass
    private rekognitionKeys: any | undefined 
    private rekognition: Rekognition | undefined
    private emotionObject!: EmotionObjectInterface | null

    private ready: Promise<void>

    private constructor() {
        super()

        this.ready = this.initialize()

        EventService.on(EmotionEvents.EMOTIONS_START_EMOTION_CAPTURE, () => {
            
        })

        EventService.on(EmotionEvents.EMOTIONS_STOP_EMOTION_CAPTURE, () => {
            this.stopRealTimeAnalysis()
        })

        EventService.on(VideoEvents.VIDEO_LOCAL_HTML_REQUESTED, async (html) => {
            await this.ready
            await this.setEmotionObject(html)
            this.startRealTimeAnalysis()
        })

    }

    // Singleton pattern to ensure a single instance of the EmotionService
    public static getInstance(): EmotionServiceClass {
        if (!EmotionServiceClass.instance) {
            EmotionServiceClass.instance = new EmotionServiceClass()
        }
        return EmotionServiceClass.instance
    }

    private initialize = async () => {

        try{

            const response = await fetch('/api/rekognition-get-keys', { method: 'GET' })
            const data = await response.json()
            this.rekognitionKeys = data.item

            this.rekognition = new Rekognition({
                accessKeyId: this.rekognitionKeys.AWS_ACCESS_KEY_ID,
                secretAccessKey: this.rekognitionKeys.AWS_SECRET_ACCESS_KEY,
                region: this.rekognitionKeys.AWS_REGION
            })

            this.initializeEmotionObject()

            logInfo(`Emotion-Service: Rekognition Client Initialized`)

        }catch(e){
            logError(`Emotion-Service: Initialization Error ${e}`)
        }

    }

    private initializeEmotionObject = () => {
        this.emotionObject = {
            html: null,
            isSet: false,
            canvas: null,
            imageBlob: null,
            emotions: []
        }
    }

    private setEmotionObject = async (html: HTMLDivElement) => {

        logInfo(`Emotion-Service: Setting emotion object with canvas from ${html}`)
        if(!this.emotionObject){
            this.initializeEmotionObject()
        }
        this.emotionObject!.html = html
        this.emotionObject!.canvas = await this.getCanvas(html)
        this.emotionObject!.imageBlob = await this.getImageBlob(this.emotionObject!.canvas)
        this.emotionObject!.isSet = true
    }

    private getCanvas = async (html: HTMLDivElement): Promise<HTMLCanvasElement> => {
        
        const video = html.querySelector<HTMLVideoElement>('video')
        if (!video) {
            logError(`EmotionSerice: getCanvas no <video> element found`)
            throw new Error('EmotionService: getCanvas: no <video> element found')
        }
      
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
            await new Promise<void>(resolve => {
                const handler = () => {
                    video.removeEventListener('loadedmetadata', handler)
                    resolve()
                }
                video.addEventListener('loadedmetadata', handler)
            })
        }

        const width  = video.videoWidth  || video.clientWidth
        const height = video.videoHeight || video.clientHeight
      
        if (!width || !height) {
            logError(`EmotionService: getCanvas: unable to determine video dimensions`)
            throw new Error('getCanvas: unable to determine video dimensions')
        }
      
        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
      
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            logError(`EmotionService: getCanvas: could not get 2D context`)
            throw new Error('getCanvas: could not get 2D context')
        }
      
        ctx.drawImage(video, 0, 0, width, height)
        return canvas
    }


    private getImageBlob(canvas: HTMLCanvasElement | null, type = 'image/jpeg'): Promise<Blob> {
  
        return new Promise((resolve, reject) => {
            canvas?.toBlob(blob => {
                if (blob) resolve(blob)
                else reject(new Error('EmotionService: getImageBlob: toBlob returned null'))
            }, type)
        })
    }

    private analyzeFrame = async (): Promise<void> => {

        try {
            const emo = this.emotionObject
            if (!emo?.html) {
                logError(`EmotionService: analyzeFrame: no HTMLDivElement available`)
                throw new Error('analyzeFrame: no HTMLDivElement available')
            }

            // Always build a fresh canvas from the live video
            const canvas = await this.getCanvas(emo.html)

            // Turn it into a Blob (this now should never be null)
            const blob = await this.getImageBlob(canvas)

            // Prepare Rekognition payload
            const buffer = await blob.arrayBuffer()
            const bytes  = new Uint8Array(buffer)
            const rekog  = this.rekognition
            if (!rekog) {
                logError(`EmotionService: analyzeFrame: Rekognition client not initialized`)
                throw new Error('analyzeFrame: Rekognition client not initialized')
            }

            const result = await rekog
            .detectFaces({ Image: { Bytes: bytes }, Attributes: ['ALL'] })
            .promise()

            if (!result?.FaceDetails) {
                logError(`EmotionService: analyzeFrame: no face details returned`)
                throw new Error('analyzeFrame: no face details returned')
            }

            emo.emotions = result.FaceDetails.flatMap(face =>
                (face.Emotions || [])
                    .filter(e => (e.Confidence ?? 0) > 50)
                    .map(e => e.Type)
            )

            logInfo(`EmotionService: analyzeFrame: EMOTIONS: ${emo.emotions.join(', ')}`)
            this.broadcastEmotion(emo.emotions.join(', '))
        } catch (e) {
            logError(`EmotionService: analyzeFrame error: ${e}`)
        }
    }

    private broadcastEmotion = (emotion: string) => {
        EventService.emit(EmotionEvents.EMOTIONS_CURRENT_EMOTION, emotion)
    }
      

    private startRealTimeAnalysis = () => {
        logInfo(`EmotionService: Starting Emotion Capture`)
        logInfo(`EmotionService: EmotionObject ${JSON.stringify(this.emotionObject)}`)
        const intervalId = setInterval(async () => {
            if (this.emotionObject?.isSet) {
                logInfo(`EmotionService: Analyzing Frame`)
                await this.analyzeFrame()
            } else {
                logInfo(`EmotionService: Clearing Interval`)
                clearInterval(intervalId)
            }
        }, TIME_SLICE)
    }

    private stopRealTimeAnalysis = () => {
        logInfo(`EmotionService: Stopping Emotion Capture`)
        this.initializeEmotionObject() 
        EventService.off(EmotionEvents.EMOTIONS_CURRENT_EMOTION, this.broadcastEmotion)
    }

}

const EmotionService = EmotionServiceClass.getInstance()
export default EmotionService
