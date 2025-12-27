import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://00ff7c6399ca05eaaec56f1a6ead4f74@o4510608881025024.ingest.de.sentry.io/4510608887447632",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});
