// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isEnabled = (process.env.DEBUG_ENABLED === 'true')
const isDevelopment = (process.env.NODE_ENV === 'development')

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

Sentry.init({

  enabled: isEnabled, 
  dsn: process.env.SENTRY_DSN,

  // return null to drop all events
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    return beforeSendReturnType(event, hint)
  },

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: traceSampleRateConf,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, 

})
