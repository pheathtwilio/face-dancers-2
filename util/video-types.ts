export interface VideoRoomParameters {
    audioDeviceId: string,
    videoDeviceId: string,
    userName: string,
    roomName: string
}

export interface RoomPreferences {
        UniqueName: string,
        EmptyRoomTimeout: string
}

export enum VideoEvents {
    VIDEO_CREATE_ROOM = 'video-create-room',
    VIDEO_ROOM_CREATED = 'video-room-created',
    VIDEO_JOIN_PARTICIPANT = 'video-join-participant',
    VIDEO_PARTICIPANT_JOINED = 'video-participant-joined',
    VIDEO_JOIN_HUMAN_TO_ROOM = 'video-join-human-to-room',
    VIDEO_HUMAN_JOINED = 'video-human-joined',
    VIDEO_END_SESSION = 'video-end-session',
    VIDEO_SESSION_ENDED = 'video-session-ended',
    VIDEO_REQUEST_ROOM = 'video-request-room',
    VIDEO_ROOM_REQUESTED = 'video-room-requested',
    VIDEO_HTML_REQUESTED = 'video-html-requested',
    VIDEO_REQUEST_HTML = 'video-requested-html'
}

export interface TwilioVideoRoom {
    unique_name: string
    date_updated: string // ISO date string
    media_region: string
    max_participant_duration: number
    duration: number | null
    video_codecs: string[] // Array of supported video codecs
    large_room: boolean
    enable_turn: boolean
    empty_room_timeout: number
    sid: string // Room SID
    type: 'go' | 'group' | 'group-small' // Room type values
    status_callback_method: 'GET' | 'POST' | string
    status: 'in-progress' | 'completed' | 'failed' | 'scheduled'
    audio_only: boolean
    unused_room_timeout: number
    max_participants: number
    max_concurrent_published_tracks: number
    url: string
    record_participants_on_connect: boolean
    account_sid: string // Twilio account SID
    end_time: string | null // ISO date string or null if room is active
    date_created: string // ISO date string
    status_callback: string | null
    links: {
        recordings: string
        participants: string
        recording_rules: string
    }
}
  