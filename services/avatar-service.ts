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
import { Config } from '@/app/config/config'

class AvatarServiceClass extends EventEmitter {
    private static instance: AvatarServiceClass

    private language: string = 'en'

    private stream: ((stream: MediaStream) => void) | undefined
    private avatar: StreamingAvatar | null = null
    private token: string = ''

    private isLoadingSession: boolean = false
    private isLoadingRepeat: boolean = false

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
            const sessions = this.getSessions()
            EventService.emit(AvatarEvents.AVATAR_SESSIONS_GOT, (sessions))
        })

        EventService.on(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE, () => {
            this.handleSpeak(Config.useCase.greeting)
        })

        EventService.on(AvatarEvents.AVATAR_SAY, (words) => {
            this.handleSpeak(words)
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
            console.error('Error fetching access token:', e)
        }
        return ''
    }

    public async initialize() {
        this.token = await this.fetchAccessToken()
        this.isLoadingSession = true
        this.avatar = new StreamingAvatar({token: this.token})

        // Register Events
        this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, async () => {
            await this.endSession()
        })
        this.avatar.on(StreamingEvents.STREAM_READY, (e) => {
            console.log(AvatarEvents.AVATAR_STREAM_READY)
            if(e.detail)
                this.stream = e.detail

            EventService.emit(AvatarEvents.AVATAR_STARTED_SESSION, this.stream) // other services will listen for this 
        })
        this.avatar.on(StreamingEvents.USER_START, (e) => {})
        this.avatar.on(StreamingEvents.USER_STOP, (e) => {})
        this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
            console.log('avatar started talking')
            EventService.emit(AvatarEvents.AVATAR_START_TALKING)
        })
        this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
            console.log('avatar stopped talking')
            EventService.emit(AvatarEvents.AVATAR_STOP_TALKING)
        })

        try {

            const response = await this.avatar.createStartAvatar({
                quality: AvatarQuality.High,
                avatarName: Config.useCase.avatar_id,
                voice: { rate: 1.5, emotion: VoiceEmotion.EXCITED },
                language: this.language,
                disableIdleTimeout: true
            })

        }catch(e){
            console.error(e)
        }finally{
            this.isLoadingSession = false
        }

    }

    public getSessions = async () => {
        const url = 'https://api.heygen.com/v1/streaming.list'
        const apiKey = process.env.NEXT_PUBLIC_HEYGEN_API_KEY

        if(!apiKey){
            console.error('HEYGEN APIKEY is not defined')
            return null
        }

        try{
            const response = await fetch(url, {
                method: 'GET', 
                headers: {
                    'Accept': 'application/json',
                    'x-api-key': apiKey
                }
            })

            if(!response.ok){
                throw new Error(`${response.status}`)
            }

            const sessionObject = await response.json()

            let data: object[] = []
            if(!sessionObject.data)
                throw new Error('No data on Sessions Object')

            if(sessionObject.data.sessions.length > 0){
                for(let i=0; i < sessionObject.data.sessions.length; i++){
                    data.push(sessionObject.data.sessions[i])
                }
            }

            return data

        }catch(e){console.error(e)}
    }

    public closeSession = async (id: string) => {
        const url = 'https://api.heygen.com/v1/streaming.stop'
        const apiKey = process.env.NEXT_PUBLIC_HEYGEN_API_KEY

        if(!apiKey){
            console.error('HEYGEN APIKEY is not defined')
            return null
        }

        try{
            const response = await fetch(url, {
                method: 'POST', 
                headers: {
                    'Accept': 'application/json',
                    'Content-Type':'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ session_id: id})
            })

            if(!response.ok){
                throw new Error(`${response.status}`)
            }

            const data = await response.json()
            console.log(data)
            return data

        }catch(e){console.error(e)}
    }

    public endSession = async () => {
        console.log(AvatarEvents.AVATAR_SESSION_ENDED)
        EventService.emit(AvatarEvents.AVATAR_SESSION_ENDED)
        if(this.avatar)
            try{
                await this.avatar.stopAvatar()
                this.stream = undefined
            }catch(e){console.error(e)}    
    }

    public handleSpeak = async (text: string) => {

        if (!this.avatar) {
            console.log('Avatar API not initialized')
            return
        }

        // Interrupt if speaking
        await this.avatar.interrupt().catch((e) => console.log(e.message))
        await this.avatar.speak({ text: text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC }).catch((e) => console.log(e.message))

    }

}

// Export the singleton instance
const AvatarService = AvatarServiceClass.getInstance()
export default AvatarService

