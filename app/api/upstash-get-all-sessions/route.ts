import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { logInfo } from '@/services/logger-service'

// initialize Upstash client (add your env vars)
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function GET(req: Request) {

  let cursor = 0
  const allKeys: string[] = []

  do {
      const [nextCursor, keys] = await redis.scan(cursor, {match: '*', count: 100})
      cursor = Number(nextCursor)
      allKeys.push(...keys)
  } while (cursor !== 0)

  logInfo(`upstash-get-all-keys: got cache ${JSON.stringify(allKeys)}`)

  return NextResponse.json({ allKeys })


}
