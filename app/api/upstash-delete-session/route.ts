import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { logInfo } from '@/services/logger-service'

// initialize Upstash client (add your env vars)
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function DELETE(req: Request) {

  const body = await req.json()
  const { sessionId } = body

  if (!sessionId) {
    logInfo(`upstash-delete-session: no SessionId was passed, nothing to do`)
    return NextResponse.json({ success: false, error: 'Missing SessionId'}, {status: 400})
  }else{

    const numberOfKeys = await redis.del(`sess:${sessionId}`)
    if(numberOfKeys >= 1){
        logInfo(`upstash-delete-session: redis deleted ${numberOfKeys} keys for id=${sessionId}`)
    }else{
        logInfo(`upstash-delete-session: redis deleted ${numberOfKeys} keys for id=${sessionId}`)
    }

    const response = NextResponse.json({ success: (numberOfKeys >= 1)})
    response.cookies.delete('sessionId')
    return response

  }

}
