import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  // ✅ Correct DSN — must match the server/edge config
  dsn: "https://659aeff71422287dcb9c88784bf1e71c@o4510608881025024.ingest.de.sentry.io/4510608889872464",

  // Tag environment so dev/prod errors are separated in Sentry dashboard
  environment: process.env.NODE_ENV ?? "development",

  // Production: 10% of traces. Development: 100% for easy debugging.
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Replay: capture ALL error sessions, 5% of normal sessions in production
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: isProd ? 0.05 : 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  debug: false,
});
