// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({

  enabled: (process.env.NODE_ENV === 'production'),
  dsn: process.env.SENTRY_DSN,

  // return null to drop all events
  beforeSend(e){
    return null
  },

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: (process.env.NODE_ENV === 'production'? 0 : 1),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: (process.env.DEBUG_ENABLED === 'true'),
});
