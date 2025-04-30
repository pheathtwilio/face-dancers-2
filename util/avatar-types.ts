enum AvatarEvents {
    AVATAR_INITIALIZE = 'avatar-initialize',
    AVATAR_GET_SESSIONS = 'avatar-get-sessions',
    AVATAR_SESSIONS_GOT = 'avatar-sessions-got',
    AVATAR_STARTED_SESSION = 'avatar-started',
    AVATAR_STREAM_READY = 'avatar-stream-ready',
    AVATAR_CLOSE_SESSION= 'avatar-close-session',
    AVATAR_END_SESSION = 'avatar-end-session',
    AVATAR_SESSION_ENDED = 'avatar-session-ended',
    AVATAR_SEND_WELCOME_MESSAGE = 'avatar-send-welcome-message',
    AVATAR_START_TALKING = 'avatar-start-talking',
    AVATAR_STOP_TALKING = 'avatar-stop-talking',
    AVATAR_SAY = 'avatar-say',
    AVATAR_SPEECH_SESSION_START = 'avatar-speech-session-start',
    AVATAR_SPEECH_SESSION_END = 'avatar-speech-session-end'
}

export default AvatarEvents