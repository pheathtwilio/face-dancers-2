import EventService from './event-service'
import EventEmitter from 'events'

import { logInfo, logError } from '@/services/logger-service'


class EmotionServiceClass extends EventEmitter {

    private static instance: EmotionServiceClass

    private constructor() {
        super()

        
    }

    // Singleton pattern to ensure a single instance of the EmotionService
    public static getInstance(): EmotionServiceClass {
        if (!EmotionServiceClass.instance) {
            EmotionServiceClass.instance = new EmotionServiceClass()
        }
        return EmotionServiceClass.instance
    }


}

const EmotionService = EmotionServiceClass.getInstance()
export default EmotionService
