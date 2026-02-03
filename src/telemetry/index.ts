/**
 * Telemetry module for admin-ui
 *
 * Re-exports Application Insights functionality for easy consumption.
 *
 * Usage:
 *   import { trackEvent, trackException } from './telemetry';
 *
 *   // Track custom event
 *   trackEvent('ProductCreated', { productId: '123' });
 *
 *   // Track exception
 *   trackException(error, { component: 'ProductForm' });
 */

export {
  initializeAppInsights,
  getAppInsights,
  getReactPlugin,
  trackEvent,
  trackException,
  trackPageView,
  trackMetric,
  setAuthenticatedUser,
  clearAuthenticatedUser,
  flushTelemetry,
} from './appInsights';

export { default as telemetry } from './appInsights';
