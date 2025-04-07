// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

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
