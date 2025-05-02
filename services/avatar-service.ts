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

  private language = 'en'
  private stream?: (stream: MediaStream) => void
  private avatar: StreamingAvatar | null = null
  private token = ''
  private useCase: UseCase = configData.useCase

  private avatarIsSpeaking = false
  private snippetQueue: string[] = []

  private constructor() {
    super()

    // keep useCase up to date
    EventService.on(ConfigEvents.CONFIG_USECASE_GOT, (useCase: UseCase) => {
      this.useCase = useCase
    })

    // session lifecycle
    EventService.on(AvatarEvents.AVATAR_INITIALIZE,    () => this.initialize())
    EventService.on(AvatarEvents.AVATAR_END_SESSION,   () => this.endSession())
    EventService.on(AvatarEvents.AVATAR_CLOSE_SESSION, (id: string) => this.closeSession(id))
    EventService.on(AvatarEvents.AVATAR_GET_SESSIONS,  () => this.getSessions())
    EventService.on(AvatarEvents.AVATAR_SEND_WELCOME_MESSAGE, () =>
      this.enqueueSnippet(this.useCase.greeting)
    )

    // enqueue LLM outputs
    EventService.on(AvatarEvents.AVATAR_SAY, (words: string) =>
      this.enqueueSnippet(words)
    )

    // handle interrupt
    EventService.on(llmTypes.LLM_INTERRUPT, () => this.handleInterrupt())

    // when the SDK signals a snippet is done
    EventService.on(AvatarEvents.AVATAR_STOP_TALKING, () => {
      logInfo(`Avatar-Service: received STOP_TALKING event -> avatarIsSpeaking = false`)
      this.avatarIsSpeaking = false
      if (this.snippetQueue.length === 0) {
        logInfo(
          `Avatar-Service: on AvatarEvents.AVATAR_STOP_TALKING -> signalling ${AvatarEvents.AVATAR_SPEECH_SESSION_END}`
        )
        EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_END)
      }
      this.trySpeakNext()
    })

  }

  public static getInstance(): AvatarServiceClass {
    if (!AvatarServiceClass.instance) {
      AvatarServiceClass.instance = new AvatarServiceClass()
    }
    return AvatarServiceClass.instance
  }

  private fetchAccessToken = async (): Promise<string> => {
    try {
      const res = await fetch('/api/avatar', { method: 'POST' })
      const { token } = await res.json()
      return token
    } catch (e) {
      logError(`Avatar-Service: fetch token error: ${e}`)
      return ''
    }
  }

  public async initialize() {
    this.token = await this.fetchAccessToken()
    this.avatar = new StreamingAvatar({ token: this.token })

    // wait for useCase if not already set
    this.useCase = await new Promise<UseCase>((resolve) => {
      EventService.once(ConfigEvents.CONFIG_USECASE_GOT, resolve)
      EventService.emit(ConfigEvents.CONFIG_GET_USECASE)
    })

    // wire SDK events
    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, async () =>
      this.endSession()
    )

    this.avatar.on(StreamingEvents.STREAM_READY, (e) => {
      logInfo(AvatarEvents.AVATAR_STREAM_READY)
      if (e.detail) this.stream = e.detail
      EventService.emit(AvatarEvents.AVATAR_STARTED_SESSION, {
        stream: this.stream,
        avatarName: this.useCase.avatar_name,
      })
    })

    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      // first snippet? session start
      if (!this.avatarIsSpeaking && this.snippetQueue.length > 0) {
        logInfo(
          `Avatar-Service: on StreamingEvents.AVATAR_START_TALKING -> signalling ${AvatarEvents.AVATAR_SPEECH_SESSION_START}`
        )
        EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_START)
      }
    })

    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      logInfo('Avatar-Service: snippet finished -> resetting speaking flag')

      this.avatarIsSpeaking = false
      if(this.snippetQueue.length === 0){
        logInfo(
          `Avatar-Service: queue empty -> signalling ${AvatarEvents.AVATAR_SPEECH_SESSION_END}`
        )
        EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_END)
      }
      this.trySpeakNext()
    })

    try {
      await this.avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: this.useCase.avatar_id,
        voice: { rate: 1.5, emotion: VoiceEmotion.EXCITED },
        language: this.language,
        disableIdleTimeout: true,
      })
    } catch (e) {
      logError(`Avatar-Service: createStartAvatar error: ${e}`)
    }
  }

  public async getSessions() {
    try {
      const res = await fetch('/api/avatar-get-sessions')
      const data = await res.json()
      EventService.emit(AvatarEvents.AVATAR_SESSIONS_GOT, data.item)
    } catch (e) {
      logError(`Avatar-Service: getSessions error: ${e}`)
    }
  }

  public async closeSession(id: string) {
    try {
      await fetch('/api/avatar-close-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (e) {
      logError(`Avatar-Service: closeSession error: ${e}`)
    }
  }

  public async endSession() {
    EventService.emit(AvatarEvents.AVATAR_SESSION_ENDED)
    if (this.avatar) {
      try {
        this.stream = undefined
        await this.avatar.stopAvatar()
      } catch (e) {
        logError(`Avatar-Service: stopAvatar error: ${e}`)
      }
    }
  }

  // Interrupt: stop current speech, clear pending, end session 
  private handleInterrupt() {
    logInfo('Avatar-Service: INTERRUPT -> flushing queue')
    this.snippetQueue = []
    this.avatarIsSpeaking = false
    if (this.avatar) {
      this.avatar.interrupt().catch((e) =>
        logError(`Avatar-Service: interrupt error: ${e}`)
      )
    }
    EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_END)
  }

  // Enqueue text and start speaking if idle 
  private enqueueSnippet(text: string) {
    logInfo(`Avatar-Service: Enqueueing snippet -> "${text}"`)

    const wasEmpty = this.snippetQueue.length === 0
    this.snippetQueue.push(text)
    if(wasEmpty){
      EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_START)
    }
    this.trySpeakNext()
  }

  // Dequeue and speak next snippet if available 
  private trySpeakNext() {
    if (this.avatarIsSpeaking || !this.avatar) return
  
    const next = this.snippetQueue.shift()
    if (!next) {
      // no more snippets → session end
      EventService.emit(AvatarEvents.AVATAR_SPEECH_SESSION_END)
      return
    }
  
    logInfo(`Avatar-Service: Dequeuing snippet SPEAK -> "${next}"`)
    this.avatarIsSpeaking = true
  
    this.avatar
      .speak({
        text: next,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.ASYNC,
      })
      .catch((e) => {
        logError(`Avatar-Service: speak error: ${e}`)
        this.avatarIsSpeaking = false
        this.trySpeakNext()
      })
  }
}

export default AvatarServiceClass.getInstance()
