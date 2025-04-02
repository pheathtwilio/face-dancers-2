// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({

  enabled: (process.env.NODE_ENV === 'production'),
  dsn: process.env.SENTRY_DSN,

  // return null to drop all events
  beforeSend(e){
    return null
  },

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: (process.env.NODE_ENV === 'production'? 0 : 1),

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: (process.env.NODE_ENV === 'production'? 0 : 0.1),

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: (process.env.NODE_ENV === 'production'? 0 : 1.0),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: (process.env.DEBUG_ENABLED === 'true'),
});
