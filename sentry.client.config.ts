// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

const isEnabled = (process.env.DEBUG_ENABLED === 'true')
const isDevelopment = (process.env.NODE_ENV === 'development')
const dsnValue = `${process.env.SENTRY_DSN}`

console.log(`DSN VALUE ${dsnValue}`)

const beforeSendReturnType = async (
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint
): Promise<Sentry.ErrorEvent | null> => {
  if (isEnabled) {
    return event
  } else {
    return null
  }
}

const traceSampleRateConf = (isDevelopment? 1 : 0)
const replaysSessionSampleRateConf = (isDevelopment ? 0.1 : 0)
const replaysOnErrorSampleRateConf = (isDevelopment ? 1.0 : 0)

Sentry.init({

  enabled: isEnabled, 
  dsn: process.env.SENTRY_DSN, 

  // return null to drop all events
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    return beforeSendReturnType(event, hint)
  },

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: traceSampleRateConf, 

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: replaysSessionSampleRateConf, 

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: replaysOnErrorSampleRateConf, 

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false
});
