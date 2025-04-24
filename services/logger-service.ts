import * as Sentry from '@sentry/nextjs'
import chalk from 'chalk'

const localLogging = process.env.NEXT_PUBLIC_LOCAL_LOGGING === 'true'

export const logInfo = async (info: string) => {
    if(localLogging){
        console.info(chalk.yellow(info))
    }else{
        Sentry.captureMessage(info, 'info')
    }
}

export const logError = async (error: string) => {
    if(localLogging){
        console.error(chalk.red(error))
    }else{
        Sentry.captureMessage(error, 'error')
    }
}