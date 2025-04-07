enum SessionTypes {
    ITEM_TTL = parseInt(process.env.SESSION_LENGTH_IN_MILLISECONDS != null ? process.env.SESSION_LENGTH_IN_MILLISECONDS : '600')
}

export default SessionTypes