import EventEmitter from 'events'

class LLMServiceClass extends EventEmitter {

    private static instance: LLMServiceClass

    private constructor() {
        super()
    }

    // Singleton pattern to ensure a single instance of the VideoService
    public static getInstance(): LLMServiceClass {
        if (!LLMServiceClass.instance) {
        LLMServiceClass.instance = new LLMServiceClass()
        }
        return LLMServiceClass.instance
    }


    public endSession = async () => {

    }


}

const LLMService = LLMServiceClass.getInstance()
export default LLMService
