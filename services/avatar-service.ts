import EventEmitter from 'events'
import StreamingAvatar, {
    AvatarQuality,
    StreamingEvents,
    TaskMode,
    TaskType,
    VoiceEmotion,
  } from '@heygen/streaming-avatar'
import EventService from './event-service'
import AvatarEvents from '../util/avatar-types'
import { configData, UseCase } from '@/app/config/config'

import { logInfo, logError } from '@/services/logger-service'
import ConfigEvents from '@/util/config-types'
import llmTypes from '@/util/llm-types'

class AvatarServiceClass extends EventEmitter {
    private static instance: AvatarServiceClass

    private language: string = 'en'

    private stream: ((stream: MediaStream) => void) | undefined
    private avatar: StreamingAvatar | null = null
    private token: string = ''
    private useCase: UseCase = configData.useCase

    private isLoadingSession: boolean = false
    private isLoadingRepeat: boolean = false

    private avatarIsSpeaking: boolean = false

    // Private constructor prevents external instantiation
    private constructor() {
        super()

        // register events
        EventService.on(AvatarEvents.AVATAR_INITIALIZE, () => {
            this.initialize()
        })

        EventService.on(AvatarEvents.AVATAR_END_SESSION, () => {
            this.endSession()
        })

        EventService.on(AvatarEvents.AVATAR_CLOSE_SESSION, (sessionId) => {
            this.closeSession(sessionId)
        })

        EventService.on(AvatarEvents.AVATAR_GET_SESSIONS, () => {
            this.getSessions()
        })

        EventService.on(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE, () => {
            this.handleSpeak(this.useCase.greeting)
        })

        EventService.on(AvatarEvents.AVATAR_SAY, (words) => {
            this.handleSpeak(words)
        })

        EventService.on(AvatarEvents.AVATAR_STOP_TALKING, () => {
            this.interrupt()
        })

    }

    // Static method to get the single instance
    public static getInstance(): AvatarServiceClass {
        if (!AvatarServiceClass.instance) {
            AvatarServiceClass.instance = new AvatarServiceClass()
        }
        return AvatarServiceClass.instance
    }

    private fetchAccessToken = async () => {
        try {
            const response = await fetch('/api/avatar', { method: 'POST' })
            const wallet = await response.json()
            return wallet.token
        } catch (e) {
            logError(`Avatar-Service: Error Fetching Access Token ${e}`)
        }
        return ''
    }

    public async initialize() {
        this.token = await this.fetchAccessToken()
        this.isLoadingSession = true
        this.avatar = new StreamingAvatar({token: this.token})


        this.useCase = await new Promise<UseCase>((resolve) => {

            EventService.on(ConfigEvents.CONFIG_USECASE_GOT, (useCase: UseCase) => {
                resolve(useCase)
            })

            EventService.emit(ConfigEvents.CONFIG_GET_USECASE)
        })

        // Register Events
        this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, async () => {
            await this.endSession()
        })
        this.avatar.on(StreamingEvents.STREAM_READY, (e) => {
            logInfo(AvatarEvents.AVATAR_STREAM_READY)
            if(e.detail)
                this.stream = e.detail

            EventService.emit(AvatarEvents.AVATAR_STARTED_SESSION, this.stream) 
        })
        this.avatar.on(StreamingEvents.USER_START, (e) => {})
        this.avatar.on(StreamingEvents.USER_STOP, (e) => {})
        this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
            this.avatarIsSpeaking = true
            logInfo('Avatar-Service: Avatar started talking')
            EventService.emit(AvatarEvents.AVATAR_START_TALKING)
        })
        this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
            this.avatarIsSpeaking = false
            logInfo('Avatar-Service: Avatar stopped talking')
            EventService.emit(AvatarEvents.AVATAR_STOP_TALKING)
        })

        try {

            const response = await this.avatar.createStartAvatar({
                quality: AvatarQuality.High,
                avatarName: this.useCase.avatar_id,
                voice: { rate: 1.5, emotion: VoiceEmotion.EXCITED },
                language: this.language,
                disableIdleTimeout: true
            })

        }catch(e){
            logError(`Avatar Service: Error Creating Avatar ${e}`)
        }finally{
            this.isLoadingSession = false
        }

    }

    public getSessions = async () => {
   
        try{

            const response = await fetch('/api/avatar-get-sessions')
            const data = await response.json()
            EventService.emit(AvatarEvents.AVATAR_SESSIONS_GOT, (data.item))

        }catch(e){logError(`Avatar-Service: Error Creating Session ${e}`)}
    }

    public closeSession = async (id: string) => {
 

        try{
        
            const response = await fetch('/api/avatar-close-session', {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            })

            const data = await response.json()   
            return data

        }catch(e){logError(`Avatar-Service: Stop Streaming Error ${e}`)}
    }

    public endSession = async () => {
        logInfo(`Avatar-Service: ${AvatarEvents.AVATAR_SESSION_ENDED}`)
        EventService.emit(AvatarEvents.AVATAR_SESSION_ENDED)
        if(this.avatar)
            try{
                await this.avatar.stopAvatar()
                this.stream = undefined
            }catch(e){logError(`Avatar-Service: Session End Error ${e}`)}    
    }

    private interrupt = async () => {
        if(this.avatarIsSpeaking){
            // an interrupt is happening notify the LLM to save the current context
            EventService.emit(llmTypes.LLM_INTERRUPT)
        }
        this.avatar?.interrupt().catch((e) => logInfo(`Avatar-Service: Interrupt - ${e.message}`))
    }

    public handleSpeak = async (text: string) => {

        if (!this.avatar) {
            logInfo(`Avatar-Service: Avatar API not initialized`)
            return
        }

        await this.avatar.speak({ text: text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC }).catch((e) => logInfo(`Avatar-Service: Speaking - ${e.message}`))

    }

}

// Export the singleton instance
const AvatarService = AvatarServiceClass.getInstance()
export default AvatarService

