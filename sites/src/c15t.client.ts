import type { C15tClientOptionsExtension } from "@c15t/astro";
import { databuddy } from "@c15t/integrations/databuddy";
import { gtag } from "@c15t/integrations/google-tag";
import { plausibleAnalytics } from "@c15t/integrations/plausible-analytics";
import { posthog } from "@c15t/integrations/posthog";
import { umamiAnalytics } from "@c15t/integrations/umami-analytics";

const analytics = __NOTRA_CONSENT_ANALYTICS__;

export default {
  scripts: [
    ...(analytics.databuddy
      ? [
          {
            ...databuddy({
              clientId: analytics.databuddy.clientId,
              scriptUrl: analytics.databuddy.scriptUrl,
              apiUrl: analytics.databuddy.apiUrl,
              configWhenGranted: {
                ...analytics.databuddy.options,
                disabled: false,
              },
              configWhenDenied: {
                ...analytics.databuddy.options,
                disabled: true,
              },
            }),
            alwaysLoad: false,
          },
        ]
      : []),
    ...(analytics.gtag
      ? [
          gtag({
            id: analytics.gtag.id,
            category: "measurement",
            loadMode: "after-consent",
          }),
        ]
      : []),
    ...(analytics.posthog
      ? [
          posthog({
            id: analytics.posthog.id,
            apiHost: analytics.posthog.apiHost,
            loadMode: "after-consent",
            initOptions: {
              cookieless_mode: "never",
              disable_session_recording:
                analytics.posthog.disableSessionRecording,
            },
          }),
        ]
      : []),
    ...(analytics.plausible ? [plausibleAnalytics(analytics.plausible)] : []),
    ...(analytics.umami ? [umamiAnalytics(analytics.umami)] : []),
  ],
} satisfies C15tClientOptionsExtension;
