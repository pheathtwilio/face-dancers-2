import EventEmitter from 'events'
import { VideoEvents, RoomPreferences, TwilioVideoRoom } from '@/util/video-types'
import { connect, LocalTrackPublication, Room } from 'twilio-video'
import AvatarEvents from '@/util/avatar-types'
import EventService from './event-service'

import * as Sentry from '@sentry/nextjs'

class VideoServiceClass extends EventEmitter {

    private static instance: VideoServiceClass

    private roomName: string = 'face-dancers' // want this room name to be the same all the time
    private room: TwilioVideoRoom | null = null

    private videoRoom: Room | null = null

    private container: HTMLDivElement | null = null

    private roomPrefs: RoomPreferences = {
        UniqueName: this.roomName,
        EmptyRoomTimeout: '5', // 5 minutes
        recordParticipantsOnConnect: true,
        maxParticipants: 2
    }

    private constructor() {
        super()

        // register listeners
        EventService.on(AvatarEvents.AVATAR_STARTED_SESSION, (stream: MediaStream) => {
            this.createRoomFromStream('Sofie', this.roomPrefs, stream)
        })

        EventService.on(VideoEvents.VIDEO_END_SESSION, () => {
            this.endSession()
        })

        EventService.on(VideoEvents.VIDEO_REQUEST_HTML, () => {
            Sentry.captureMessage(`Video-Service: ${VideoEvents.VIDEO_REQUEST_HTML}`, 'info')
            let html: HTMLDivElement | null = null
            html = this.getHTMLMediaElements()
            EventService.emit(VideoEvents.VIDEO_HTML_REQUESTED, html)
        })

        EventService.on(AvatarEvents.AVATAR_START_TALKING, () => {
            this.unMuteAudio()
        })

        EventService.on(AvatarEvents.AVATAR_STOP_TALKING, () => {
            this.muteAudio()
        })

        EventService.on(VideoEvents.VIDEO_JOIN_PARTICIPANT, (username, audioDeviceId, videoDeviceId) => {
            this.joinParticipant(username, audioDeviceId, videoDeviceId)
        })

        EventService.on(VideoEvents.VIDEO_LIST_ROOMS, () => {
            this.listRooms()
        })

        EventService.on(VideoEvents.VIDEO_END_ROOM, (roomSid) => {
            this.endRoom(roomSid)
        })

    }

    // Singleton pattern to ensure a single instance of the VideoService
    public static getInstance(): VideoServiceClass {
        if (!VideoServiceClass.instance) {
        VideoServiceClass.instance = new VideoServiceClass()
        }
        return VideoServiceClass.instance
    }

    private createRoomFromStream = async (
        userName: string,
        roomPrefs: RoomPreferences,
        stream: MediaStream
    ) => {

        const response = await (fetch('api/twilio-video-create-room', {
            method: 'POST',
            body: JSON.stringify(roomPrefs)
        }))

        const roomData = await response.json() 
        if(!this.room)
            this.room = roomData.room

        const tokenFetch = await (fetch('api/twilio-video-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ userName: userName, roomName: this.roomName }) // userName and roomName
        }))
 
        const { token } = await tokenFetch.json()
        if(!token) throw new Error('Failed to retrieve JWT token')

        const tracks = stream.getTracks()

        this.videoRoom = await connect(token, {
            name: this.roomName,
            tracks: tracks
        })

        Sentry.captureMessage(`Video-Service: ${VideoEvents.VIDEO_PARTICIPANT_JOINED}`, 'info')
        EventService.emit(VideoEvents.VIDEO_PARTICIPANT_JOINED, userName)

    }

    private getHTMLMediaElements = () => {

        if (!this.videoRoom) throw new Error('no video room has been set')

        // Create a container element to hold both video and audio elements
        this.container = document.createElement('div')

        this.videoRoom.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
            if (publication.track) {
                if (publication.track.kind === 'video') {
                    Sentry.captureMessage(`Video-Service: Video Track Found ${publication.track}`, 'info')
                    const videoElement = document.createElement('video')
                    videoElement.autoplay = true
                    videoElement.playsInline = true
                    publication.track.attach(videoElement)
                    this.container!.appendChild(videoElement)
                } else if (publication.track.kind === 'audio') {
                    Sentry.captureMessage(`Video-Service: Audio Track Found ${publication.track}`, 'info')
                    const audioElement = document.createElement('audio')
                    audioElement.autoplay = true
                    publication.track.attach(audioElement)
                    this.container!.appendChild(audioElement)
                    audioElement.play().catch(e => Sentry.captureMessage(`Video-Service: Video Play Error ${e}`, 'error'))
                }
            }
        })

        return this.container
    }

    private joinParticipant = async (
        userName: string,
        audioDeviceId: string, 
        videoDeviceId: string
    ) => {

        const tokenFetch = await (fetch('api/twilio-video-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ userName: userName, roomName: this.roomName }) // userName and roomName
        }))
 
        const { token } = await tokenFetch.json()
        if(!token) throw new Error('Failed to retrieve JWT token')

        const constraints = {
            audio: {deviceId: audioDeviceId},
            video: {deviceId: videoDeviceId}
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        const tracks = stream.getTracks()

        await connect(token, {
            name: this.roomName,
            tracks: tracks
        })

        Sentry.captureMessage(`Video-Service: ${VideoEvents.VIDEO_PARTICIPANT_JOINED}`, 'info')
    }

    private unMuteAudio = () => {
        if(!this.container) throw new Error('cannot unmute audio, html div does not exist')
        
        Sentry.captureMessage(`Video-Service: Unmuting Video`, 'info')
        const audioElement = this.container.querySelector('audio')
        audioElement!.muted = false
        audioElement?.play().catch(e => Sentry.captureMessage(`Video-Service: Audio Play Error ${e}`, 'error'))

    }

    private muteAudio = () => {
        if(!this.container) throw new Error('cannot mute audio, html div does not exist')

        Sentry.captureMessage(`Video-Service: Muting Video`, 'info')
        const audioElement = this.container.querySelector('audio')
        audioElement!.muted = true
    }

    private listRooms = async () => {
        const response = await (fetch('api/twilio-video-list-rooms', {
            method: 'GET'
        }))
        const roomService = await response.json()

        if(!roomService)
            throw new Error('no room service received')

        EventService.emit(VideoEvents.VIDEO_ROOMS_LISTED, roomService.rooms.rooms)
    }

    private endSession = async () => {

        if(this.room?.sid){

            try{

                const response = await (fetch('api/twilio-video-end-room', {
                    method: 'POST',
                    body: JSON.stringify({sid: this.room?.sid})
                }))

                const room = await response.json()
                Sentry.captureMessage(`Video-Service: ${VideoEvents.VIDEO_SESSION_ENDED} for ${this.room.sid}`, 'info')
                this.room = null

            }catch(e){Sentry.captureMessage(`Video-Service: End Session Error ${e}`, 'error')}
           
        }

    }

    private endRoom = async (roomSid: string) => {

        try{

            const response = await (fetch('api/twilio-video-end-room', {
                method: 'POST',
                body: JSON.stringify({sid: roomSid})
            }))

            const room = await response.json()
            Sentry.captureMessage(`Video-Service: ${VideoEvents.VIDEO_SESSION_ENDED} for ${roomSid}`, 'info')


        }catch(e){Sentry.captureMessage(`Video-Service: End Session Error ${e}`, 'error')}

    }

}

const VideoService = VideoServiceClass.getInstance()
export default VideoService
