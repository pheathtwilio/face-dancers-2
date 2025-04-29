import { logError } from "@/services/logger-service"

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION

export async function GET(_req: Request){

    if(!AWS_ACCESS_KEY_ID){
        logError(`Rekognition-Service: No AWS_ACCESS_KEY_ID`)
        throw new Error(`Rekognition-Service: No AWS_ACCESS_KEY_ID`)
    }

    if(!AWS_SECRET_ACCESS_KEY){
        logError(`Rekognition-Service: No AWS_SECRET_ACCESS_KEY`)
        throw new Error(`Rekognition-Service: AWS_SECRET_ACCESS_KEY`)
    }

    if(!AWS_REGION){
        logError(`Rekognition-Service: No AWS_REGION`)
        throw new Error(`Rekognition-Service: AWS_REGION`)
    }

    const rekognition = { AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY}

    try {

        return new Response(JSON.stringify({ item: rekognition }), { status: 200 })

    } catch (e) {
      logError(`Rekognition-get-keys: Error getting Keys ${e}`)
      return new Response(JSON.stringify({ error: 'Failed to get AWS API keys' }), { status: 500 })
    }

}

export async function POST(_req: Request){

    logError(`Deepgram-get-key: POST method not allowed`)
    return new Response(JSON.stringify({error: 'POST method not allowed'}), {status: 405})

}