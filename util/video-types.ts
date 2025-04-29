export interface VideoRoomParameters {
    audioDeviceId: string,
    videoDeviceId: string,
    userName: string,
    roomName: string
}

export interface RoomPreferences {
        UniqueName: string,
        EmptyRoomTimeout: string,
        recordParticipantsOnConnect: boolean,
        maxParticipants: number
}

export enum VideoEvents {
    VIDEO_CREATE_ROOM = 'video-create-room',
    VIDEO_ROOM_CREATED = 'video-room-created',
    VIDEO_JOIN_PARTICIPANT = 'video-join-participant',
    VIDEO_PARTICIPANT_JOINED = 'video-participant-joined',
    VIDEO_END_SESSION = 'video-end-session',
    VIDEO_END_ROOM = 'video-end-room',
    VIDEO_SESSION_ENDED = 'video-session-ended',
    VIDEO_REQUEST_ROOM = 'video-request-room',
    VIDEO_ROOM_REQUESTED = 'video-room-requested',
    VIDEO_REMOTE_HTML_REQUESTED = 'video-remote-html-requested',
    VIDEO_REQUEST_REMOTE_HTML = 'video-requested-remote-html',
    VIDEO_LOCAL_HTML_REQUESTED = 'video-local-html-requested',
    VIDEO_REQUEST_LOCAL_HTML = 'video-requested-local-html',
    VIDEO_LIST_ROOMS = 'video-list-rooms',
    VIDEO_ROOMS_LISTED = 'video-rooms-listed',
    VIDEO_ROOM_DETAILS = 'video-room-details',
    VIDEO_ROOM_DETAILS_GIVEN = 'video-room-details-given'
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
  