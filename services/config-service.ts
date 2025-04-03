import EventEmitter from 'events'
import EventService from './event-service'
import { configData } from '@/app/config/config'
import type { UseCase } from '@/app/config/config'
import ConfigEvents from '@/util/config-types'

class ConfigServiceClass extends EventEmitter {

    private static instance: ConfigServiceClass
    private selectedUseCase: UseCase
    private llm: string

    private constructor() {
        super()

        // set to default 
        this.selectedUseCase = configData.useCase
        this.llm = configData.llm

        // listen for events
        EventService.on(ConfigEvents.CONFIG_GET_USECASE, () => {
            this.getUseCase()
        })
        EventService.on(ConfigEvents.CONFIG_SET_USECASE, (useCase: UseCase) => {
            this.setUseCase(useCase)
        })

        EventService.on(ConfigEvents.CONFIG_GET_LLM, () => {
            this.getLLM()
        })
        EventService.on(ConfigEvents.CONFIG_SET_LLM, (llm: string) => {
            this.setLLM(llm)
        })

    }

    // Singleton pattern to ensure a single instance of the LLMService
    public static getInstance(): ConfigServiceClass {
        if (!ConfigServiceClass.instance) {
            ConfigServiceClass.instance = new ConfigServiceClass()
        }
        return ConfigServiceClass.instance
    }

    private getUseCase = () => {
        EventService.emit(ConfigEvents.CONFIG_USECASE_GOT, (this.selectedUseCase))
    }

    private setUseCase = (useCase: UseCase) => {
        this.selectedUseCase = useCase
    }

    private getLLM = () => {
        EventService.emit(ConfigEvents.CONFIG_LLM_GOT, (this.llm))
    }

    private setLLM = (llm: string) => {
        this.llm = llm
    }

}

const ConfigService = ConfigServiceClass.getInstance()
export default ConfigService
