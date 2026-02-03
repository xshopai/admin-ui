/**
 * Application Insights Browser SDK for admin-ui
 *
 * This module initializes Azure Application Insights for browser-side telemetry.
 * It automatically tracks:
 * - Page views and navigation
 * - User sessions
 * - Exceptions and errors
 * - AJAX/fetch dependencies
 * - Performance metrics (Core Web Vitals)
 *
 * Uses the same Application Insights instance as backend services for
 * end-to-end distributed tracing.
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// React plugin for component tracking
const reactPlugin = new ReactPlugin();

// Application Insights instance (initialized lazily)
let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights with the connection string from environment
 * @returns The initialized instance or null if disabled
 */
export function initializeAppInsights(): ApplicationInsights | null {
  const connectionString = process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    console.log('[AppInsights] No connection string provided, telemetry disabled');
    return null;
  }

  if (appInsights) {
    return appInsights;
  }

  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString,
        extensions: [reactPlugin],
        extensionConfig: {
          [reactPlugin.identifier]: {},
        },
        // Enable auto-tracking features
        enableAutoRouteTracking: true, // Track page views on route change
        enableCorsCorrelation: true, // Correlate with backend calls
        enableRequestHeaderTracking: true, // Track request headers
        enableResponseHeaderTracking: true, // Track response headers
        enableAjaxPerfTracking: true, // Track AJAX performance
        enableUnhandledPromiseRejectionTracking: true, // Track unhandled promise rejections
        disableFetchTracking: false, // Track fetch API calls
        disableAjaxTracking: false, // Track XMLHttpRequest calls

        // Sampling and batching
        samplingPercentage: 100, // Capture all telemetry (adjust for production)
        maxBatchInterval: 15000, // Send telemetry every 15 seconds

        // Cookie settings (respect privacy)
        disableCookiesUsage: false, // Use cookies for session tracking
        cookieCfg: {
          enabled: true,
          domain: undefined, // Auto-detect domain
        },

        // Correlation settings for distributed tracing
        distributedTracingMode: 2, // W3C Trace Context
        correlationHeaderExcludedDomains: [], // Include all domains

        // User/session tracking
        autoTrackPageVisitTime: true, // Track time on page
        accountId: 'admin-ui', // Identify this app
      },
    });

    appInsights.loadAppInsights();

    // Add cloud role for Application Map
    appInsights.addTelemetryInitializer((envelope) => {
      if (envelope.tags) {
        envelope.tags['ai.cloud.role'] = 'admin-ui';
        envelope.tags['ai.cloud.roleInstance'] = window.location.hostname;
      }
    });

    console.log('[AppInsights] Initialized successfully');

    return appInsights;
  } catch (error) {
    console.error('[AppInsights] Failed to initialize:', error);
    return null;
  }
}

/**
 * Get the Application Insights instance
 */
export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

/**
 * Get the React plugin for component tracking
 */
export function getReactPlugin(): ReactPlugin {
  return reactPlugin;
}

/**
 * Track a custom event
 */
export function trackEvent(
  name: string,
  properties: Record<string, string> = {},
  measurements: Record<string, number> = {}
): void {
  if (appInsights) {
    appInsights.trackEvent({ name, properties, measurements });
  }
}

/**
 * Track an exception
 */
export function trackException(error: Error, properties: Record<string, string> = {}): void {
  if (appInsights) {
    appInsights.trackException({ exception: error, properties });
  }
}

/**
 * Track a page view (automatic with enableAutoRouteTracking, but can be called manually)
 */
export function trackPageView(name?: string, uri?: string): void {
  if (appInsights) {
    appInsights.trackPageView({ name, uri });
  }
}

/**
 * Track a metric
 */
export function trackMetric(name: string, value: number, properties: Record<string, string> = {}): void {
  if (appInsights) {
    appInsights.trackMetric({ name, average: value }, properties);
  }
}

/**
 * Set authenticated user context
 */
export function setAuthenticatedUser(userId: string, accountId: string | null = null): void {
  if (appInsights) {
    appInsights.setAuthenticatedUserContext(userId, accountId ?? undefined, true);
  }
}

/**
 * Clear authenticated user context (on logout)
 */
export function clearAuthenticatedUser(): void {
  if (appInsights) {
    appInsights.clearAuthenticatedUserContext();
  }
}

/**
 * Flush telemetry immediately (call before page unload)
 */
export function flushTelemetry(): void {
  if (appInsights) {
    appInsights.flush();
  }
}

// Export default object for convenience
const telemetry = {
  initialize: initializeAppInsights,
  getInstance: getAppInsights,
  getReactPlugin,
  trackEvent,
  trackException,
  trackPageView,
  trackMetric,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  flush: flushTelemetry,
};

export default telemetry;
