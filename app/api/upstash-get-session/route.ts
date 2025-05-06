import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { logInfo } from '@/services/logger-service'

// initialize Upstash client (add your env vars)
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  // crude parse; you can use 'cookie' lib
  const match      = cookieHeader.match(/sessionId=([a-f0-9-]+)/)
  let sessionId    = match?.[1]

  if (!sessionId) {
    // 1) create new
    sessionId = crypto.randomUUID()
    // (optional) store some initial data
    logInfo(`upstash-get-session: no SessionId in cookie, new SessionId=${sessionId} created`)
    const redisResponse = await redis.set(`sess:${sessionId}`, JSON.stringify({ created: Date.now() }))
    if(redisResponse === 'OK'){
        logInfo(`upstash-get-session: redis has set SessionId=${sessionId}`)
    }else{
        logInfo(`upstash-get-session: redis has NOT set SessionId=${sessionId}`)
    }
  }

  // 2) build response, set cookie
  const response = NextResponse.json({ sessionId })
  // httponly, 30-day cookie
  response.cookies.set('sessionId', sessionId, {
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 60, // 1 hour
  })
  return response
}
