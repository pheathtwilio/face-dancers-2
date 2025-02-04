import EventEmitter from 'events'
import { VideoRoomParameters, VideoEvents, RoomPreferences, TwilioVideoRoom } from '@/util/video-types'
import { connect, createLocalTracks } from 'twilio-video'
import AvatarEvents from '@/util/avatar-types'
import EventService from './event-service'

class VideoServiceClass extends EventEmitter {

    private static instance: VideoServiceClass

    // private audioDeviceId: string = ''
    // private videoDeviceId: string = ''
    // private userName: string = ''
    private roomName: string = 'face-dancers' // want this room name to be the same all the time
    private room: TwilioVideoRoom | null = null

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

        EventService.on(VideoEvents.VIDEO_JOIN_HUMAN_TO_ROOM, (params: VideoRoomParameters) => {
            // this.joinHumanToRoom(params)
        })

        // EventService.on(VideoEvents.VIDEO_CREATE_ROOM, (params: VideoRoomParameters) => {
        //     this.createRoom(params)
        // })

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

        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]

        if(!audioTrack || !videoTrack){
            throw new Error('MediaStream is missing required tracks')
        }

        const tracks = await createLocalTracks({
            audio: { deviceId: {ideal: audioTrack.getSettings().deviceId }},
            video: { deviceId: {ideal: videoTrack.getSettings().deviceId}}
        })

        await connect(token, {
            name: this.roomName,
            tracks: tracks
        })

        console.log(VideoEvents.VIDEO_PARTICIPANT_JOINED)
        EventService.emit(VideoEvents.VIDEO_PARTICIPANT_JOINED, userName)

    }

    // private joinHumanToRoom = async (params: VideoRoomParameters) => {

    //     // need to check if room exists, in this scenario an avatar MUST be joined and in the room first

    //     try{

    //         this.setRoomParams(params)

    //         const tracks = await createLocalTracks({
    //             audio: { deviceId: this.audioDeviceId || undefined },
    //             video: { deviceId: this.videoDeviceId || undefined },
    //         })
    
    //         const response = await fetch('/api/twilio-video-token', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ username: this.userName, roomName: this.roomName }),
    //         })
    
    //         if (!response.ok) {
    //             throw new Error('Failed to fetch Twilio token')
    //         }
    
    //         const wallet = await response.json()
    
    //         this.room = await connect(wallet.token, {
    //             name: this.roomName,
    //             tracks,
    //         })

    //     }catch(e){console.error(e)}

    //     EventService.emit(VideoEvents.VIDEO_HUMAN_JOINED)

    // }

    public endRoom = async () => {

        if(this.room?.sid){

            try{

                const response = await (fetch('api/twilio-video-end-room', {
                    method: 'POST',
                    body: JSON.stringify({sid: this.room?.sid})
                }))
    
                const room = await response.json()
                console.log(`${VideoEvents.VIDEO_SESSION_ENDED} for ${room.sid}`)


            }catch(e){console.error(e)}
           
        }

    }


    public endSession = async () => {

    }


}

const VideoService = VideoServiceClass.getInstance()
export default VideoService
