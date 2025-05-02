import EventEmitter from 'events'
import { VideoEvents, RoomPreferences, TwilioVideoRoom } from '@/util/video-types'
import { connect, LocalTrackPublication, Room } from 'twilio-video'
import AvatarEvents from '@/util/avatar-types'
import EventService from './event-service'
import { logInfo, logError } from '@/services/logger-service'

class VideoServiceClass extends EventEmitter {
  private static instance: VideoServiceClass

  private adjectives = [
    'fremen', 'spicey', 'desert', 'ancient', 'mystic', 'blue-eyed', 'ornithopter',
    'sandblasted', 'shrouded', 'windworn', 'reverend', 'prescient', 'dry',
    'sleepless', 'dusty', 'stillsuited', 'ceremonial', 'sublime', 'pious',
    'gilded', 'sardaukar', 'sacred', 'hollow', 'burning', 'prophetic', 'noble',
    'invisible', 'wormsign', 'sunburned', 'silent', 'fated', 'grim', 'heirborn',
    'smugglers', 'cryptic', 'loyal', 'visionary', 'rigid', 'arid', 'ritual',
    'zealous', 'ironclad', 'cloaked', 'sand-washed', 'truthbound', 'imperial',
    'dune-born', 'oathbound', 'hawkish', 'echoing'
  ]

  private nouns = [
    'muadib', 'worm', 'shaihulud', 'arrakis', 'fedaykin', 'spice', 'maker',
    'thopter', 'choam', 'lisan', 'atreides', 'harkonnen', 'sietch', 'sardaukar',
    'benegesserit', 'mentat', 'ecologist', 'kanly', 'stilgar', 'chani',
    'prophecy', 'duke', 'reverendmother', 'truthsayer', 'guild', 'shield',
    'sietchtabr', 'desertpower', 'melange', 'crysknife', 'banneret', 'council',
    'padishah', 'guildship', 'emperor', 'sandtrout', 'lasgun', 'warrior',
    'navigator', 'preacher', 'concubine', 'ducalring', 'thumper', 'harvester',
    'coriolis', 'spacer', 'jihad', 'omnius', 'face-dancer', 'no-ship',
    'suspensor', 'hajra', 'imperium', 'chakobsa', 'tleilaxu', 'sayyadina',
    'dreamer', 'truth', 'seeker'
  ]
      
  private roomName: string | null = null
  private room: TwilioVideoRoom | null = null
  private videoRoom: Room | null = null
  private container: HTMLDivElement | null = null
  private roomPrefs: RoomPreferences | null = null

  private constructor() {
    super()

    // register listeners
    EventService.on(AvatarEvents.AVATAR_STARTED_SESSION, (payload: any) => {
      const { stream, avatarName } = payload

      // create room
      this.roomName = this.generateRoomName()
      this.roomPrefs = {
        UniqueName: this.roomName,
        EmptyRoomTimeout: '1', // 1 minute
        recordParticipantsOnConnect: true,
        maxParticipants: 2
      }

      logInfo(`Video-Service: Avatar Name - ${avatarName}`)

      this.createRoomFromStream(avatarName, this.roomPrefs, stream)
    })

    EventService.on(VideoEvents.VIDEO_ROOM_DETAILS, () => {
      EventService.emit(VideoEvents.VIDEO_ROOM_DETAILS_GIVEN, this.roomPrefs)
    })

    EventService.on(VideoEvents.VIDEO_END_SESSION, () => {
      this.endSession()
    })

    EventService.on(VideoEvents.VIDEO_REQUEST_REMOTE_HTML, () => {
      logInfo(`Video-Service: ${VideoEvents.VIDEO_REQUEST_REMOTE_HTML}`)
      const html = this.getRemoteHTMLMediaElements()
      EventService.emit(VideoEvents.VIDEO_REMOTE_HTML_REQUESTED, html)
    })

    EventService.on(VideoEvents.VIDEO_REQUEST_LOCAL_HTML, (videoDeviceRef: string) => {
      logInfo(`Video-Service: ${VideoEvents.VIDEO_REQUEST_LOCAL_HTML}`)
      this.getLocalHTMLMediaElements(videoDeviceRef).then((html: HTMLDivElement) => {
        EventService.emit(VideoEvents.VIDEO_LOCAL_HTML_REQUESTED, html)
      })
    })

    // Use speech session events instead of per-snippet start/stop
    EventService.on(AvatarEvents.AVATAR_SPEECH_SESSION_START, () => {
      this.unMuteAudio()
    })
    EventService.on(AvatarEvents.AVATAR_SPEECH_SESSION_END, () => {
      this.muteAudio()
    })

    EventService.on(VideoEvents.VIDEO_JOIN_PARTICIPANT, (username, audioDeviceId, videoDeviceId) => {
      this.joinParticipant(username, audioDeviceId, videoDeviceId)
    })

    EventService.on(VideoEvents.VIDEO_LIST_ROOMS, () => {
      this.listRooms()
    })

    EventService.on(VideoEvents.VIDEO_END_ROOM, (roomSid: string) => {
      this.endRoom(roomSid)
    })
  }

  // Singleton pattern
  public static getInstance(): VideoServiceClass {
    if (!VideoServiceClass.instance) {
      VideoServiceClass.instance = new VideoServiceClass()
    }
    return VideoServiceClass.instance
  }

  private generateRoomName = () => {
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)]
    const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)] 
    const randomSuffix = crypto.randomUUID().slice(0, 4)
    return `${adj}-${noun}-${randomSuffix}`
  }

  private createRoomFromStream = async (
    userName: string,
    roomPrefs: RoomPreferences,
    stream: MediaStream
  ) => {
    const response = await fetch('/api/twilio-video-create-room', {
      method: 'POST',
      body: JSON.stringify(roomPrefs)
    })

    const roomData = await response.json()
    if (!this.room) this.room = roomData.room

    const tokenFetch = await fetch('/api/twilio-video-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, roomName: this.roomName })
    })

    const { token } = await tokenFetch.json()
    if (!token) throw new Error('Failed to retrieve JWT token')

    const tracks = stream.getTracks()
    this.videoRoom = await connect(token, {
      name: this.roomName!,
      tracks
    })

    logInfo(`Video-Service: ${VideoEvents.VIDEO_PARTICIPANT_JOINED}`)
    EventService.emit(VideoEvents.VIDEO_PARTICIPANT_JOINED, userName)
  }

  private getRemoteHTMLMediaElements = () => {
    if (!this.videoRoom) throw new Error('no video room has been set')

    this.container = document.createElement('div')

    this.videoRoom.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
      if (publication.track) {
        if (publication.track.kind === 'video') {
          logInfo(`Video-Service: Video Track Found for Remote Participant ${publication.track}`)
          const videoElement = document.createElement('video')
          videoElement.autoplay = true
          videoElement.playsInline = true
          publication.track.attach(videoElement)
          this.container!.appendChild(videoElement)
        } else if (publication.track.kind === 'audio') {
          logInfo(`Video-Service: Audio Track Found ${publication.track}`)
          const audioElement = document.createElement('audio')
          audioElement.autoplay = true
          publication.track.attach(audioElement)
          this.container!.appendChild(audioElement)
          audioElement.play().catch(e => logError(`Video-Service: Audio Play Error ${e}`))
        }
      }
    })

    return this.container!
  }

  private getLocalHTMLMediaElements = async (videoDeviceRef: string): Promise<HTMLDivElement> => {
    const videoConstraint = videoDeviceRef
      ? { deviceId: { exact: videoDeviceRef } }
      : true

    const constraints: MediaStreamConstraints = {
      video: videoConstraint,
      audio: true
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (e: any) {
      if (e.name === 'OverconstrainedError') {
        logError(`Video-Service: device ${videoDeviceRef} not found, falling back to default camera`)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } else {
        logError(`Video-Service: Failed to get local media: ${e}`)
        throw e
      }
    }

    const container = document.createElement('div')

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      logInfo(`Video-Service: Video Track Found for Local Participant ${videoTrack.label}`)
      const v = document.createElement('video')
      v.autoplay = true
      v.muted = true
      v.playsInline = true
      v.srcObject = new MediaStream([videoTrack])
      v.style.width = '100%'
      v.style.height = '100%'
      v.style.objectFit = 'contain'
      container.appendChild(v)
    } else {
      logError(`Video-Service: No video track in returned stream`)
    }

    stream.getAudioTracks().forEach(track => {
      logInfo(`Video-Service: Audio Track Found for Local Participant ${track.label}`)
      const a = document.createElement('audio')
      a.autoplay = true
      a.muted = true
      a.srcObject = new MediaStream([track])
      container.appendChild(a)
    })

    return container
  }

  private joinParticipant = async (
    userName: string,
    audioDeviceId: string,
    videoDeviceId: string
  ) => {
    const tokenFetch = await fetch('/api/twilio-video-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, roomName: this.roomName })
    })

    const { token } = await tokenFetch.json()
    if (!token) throw new Error('Failed to retrieve JWT token')

    const constraints = {
      audio: { deviceId: audioDeviceId },
      video: { deviceId: videoDeviceId }
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    const tracks = stream.getTracks()

    await connect(token, {
      name: this.roomName!,
      tracks
    })

    logInfo(`Video-Service: ${VideoEvents.VIDEO_PARTICIPANT_JOINED}`)
  }

  private unMuteAudio = () => {
    if(!this.container) throw new Error('cannot unmute audio, html div does not exist')
    
    logInfo(`Video-Service: Unmuting Video`)
    const audioElement = this.container.querySelector('audio')
    audioElement!.muted = false
    audioElement?.play().catch(e => logError(`Video-Service: Audio Play Error ${e}`))
  }

  private muteAudio = () => {
      if(!this.container) throw new Error('cannot mute audio, html div does not exist')

      logInfo(`Video-Service: Muting Video`)
      const audioElement = this.container.querySelector('audio')
      audioElement!.muted = true
  }

  private listRooms = async () => {
    try {
      const response = await fetch('/api/twilio-video-list-rooms', { method: 'GET' })
      const roomService = await response.json()
      EventService.emit(VideoEvents.VIDEO_ROOMS_LISTED, roomService.rooms.rooms)
    } catch (e) {
      logError(`Video-Service: listRooms error: ${e}`)
    }
  }

  private endSession = async () => {
    this.roomName = null
    if (this.room?.sid) {
      try {
        await fetch('/api/twilio-video-end-room', {
          method: 'POST',
          body: JSON.stringify({ sid: this.room.sid })
        })
        logInfo(`Video-Service: ${VideoEvents.VIDEO_SESSION_ENDED} for ${this.room.sid}`)
        this.room = null
      } catch (e) {
        logError(`Video-Service: endSession error: ${e}`)
      }
    }
  }

  private endRoom = async (roomSid: string) => {
    try {
      await fetch('/api/twilio-video-end-room', {
        method: 'POST',
        body: JSON.stringify({ sid: roomSid })
      })
      logInfo(`Video-Service: ${VideoEvents.VIDEO_SESSION_ENDED} for ${roomSid}`)
    } catch (e) {
      logError(`Video-Service: endRoom error: ${e}`)
    }
  }
}

const VideoService = VideoServiceClass.getInstance()
export default VideoService
