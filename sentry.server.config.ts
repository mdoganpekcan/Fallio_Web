// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://659aeff71422287dcb9c88784bf1e71c@o4510608881025024.ingest.de.sentry.io/4510608889872464",

  // Tag environment so dev/prod errors are separated in Sentry dashboard
  environment: process.env.NODE_ENV ?? "development",

  // Production: 10% of traces. Dev: 100%.
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
