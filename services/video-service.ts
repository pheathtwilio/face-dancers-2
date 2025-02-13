import EventEmitter from 'events'
import { VideoRoomParameters, VideoEvents, RoomPreferences, TwilioVideoRoom } from '@/util/video-types'
import { connect, createLocalTracks, LocalAudioTrack, LocalTrackPublication, LocalVideoTrack, Room } from 'twilio-video'
import AvatarEvents from '@/util/avatar-types'
import EventService from './event-service'

class VideoServiceClass extends EventEmitter {

    private static instance: VideoServiceClass

    // private audioDeviceId: string = ''
    // private videoDeviceId: string = ''
    // private userName: string = ''
    private roomName: string = 'face-dancers' // want this room name to be the same all the time
    private room: TwilioVideoRoom | null = null

    private videoRoom: Room | null = null

    private container: HTMLDivElement | null = null

    private roomPrefs: RoomPreferences = {
        UniqueName: this.roomName,
        EmptyRoomTimeout: '5' // 5 minutes
    }

    private constructor() {
        super()

        // register listeners
        EventService.on(AvatarEvents.AVATAR_STARTED_SESSION, (stream: MediaStream) => {
            // create a room and join the avatars stream to the room - check if room already exists
            this.createRoomFromStream('Sofie', this.roomPrefs, stream)
            // once complete emit an event that a room has been started and how many participants are in the room
        })

        EventService.on(VideoEvents.VIDEO_END_SESSION, () => {
            this.endRoom()
        })

        // EventService.on(VideoEvents.VIDEO_JOIN_HUMAN_TO_ROOM, (params: VideoRoomParameters) => {
        //     // this.joinHumanToRoom(params)
        // })

        EventService.on(VideoEvents.VIDEO_REQUEST_HTML, () => {
            console.log('video room html requested')
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

        // TODO - FIX THIS
        const roomData = await response.json() // preliminary room details
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

        console.log(VideoEvents.VIDEO_PARTICIPANT_JOINED)
        EventService.emit(VideoEvents.VIDEO_PARTICIPANT_JOINED, userName)

    }

    private getHTMLMediaElements = () => {

        if (!this.videoRoom) throw new Error('no video room has been set')

        // Create a container element to hold both video and audio elements
        this.container = document.createElement('div')

        this.videoRoom.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
            if (publication.track) {
                if (publication.track.kind === 'video') {
                    console.log('video track found')
                    const videoElement = document.createElement('video')
                    videoElement.autoplay = true
                    videoElement.playsInline = true
                    publication.track.attach(videoElement)
                    this.container!.appendChild(videoElement)
                } else if (publication.track.kind === 'audio') {
                    console.log(`Publication Audio Track ${publication.track.isEnabled}`)
                    console.log('audio track found')
                    const audioElement = document.createElement('audio')
                    audioElement.autoplay = true
                    // Optionally, mute the audio element if you want to prevent echo for local playback:
                    // audioElement.muted = true
                    publication.track.attach(audioElement)
                    this.container!.appendChild(audioElement)
                    audioElement.play().catch(e => console.error(e))
                }
            }
        })

        return this.container
    }

    private unMuteAudio = () => {
        if(!this.container) throw new Error('cannot unmute audio, html div does not exist')
        
        console.log('unmuting')
        const audioElement = this.container.querySelector('audio')
        audioElement!.muted = false
        audioElement?.play().catch(e => console.error(e))

    }

    private muteAudio = () => {
        if(!this.container) throw new Error('cannot mute audio, html div does not exist')

        console.log('muting')
        const audioElement = this.container.querySelector('audio')
        audioElement!.muted = true
    }

    public endRoom = async () => {

        if(this.room?.sid){

            try{

                const response = await (fetch('api/twilio-video-end-room', {
                    method: 'POST',
                    body: JSON.stringify({sid: this.room?.sid})
                }))
    
                const room = await response.json()
                console.log(`${VideoEvents.VIDEO_SESSION_ENDED} for ${this.room.sid}`)


            }catch(e){console.error(e)}
           
        }

    }


    public endSession = async () => {

    }


}

const VideoService = VideoServiceClass.getInstance()
export default VideoService
