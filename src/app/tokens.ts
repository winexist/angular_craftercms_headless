import { InjectionToken } from '@angular/core';

/**
 * Absolute (server) or relative (browser) URL used to load the Site Details content.
 * On the server it points to the local Express proxy so SSR never depends on the
 * incoming request's Host header (which is rewritten by the CrafterCMS preview proxy).
 */
export const SITE_DETAILS_API_URL = new InjectionToken<string>('SITE_DETAILS_API_URL', {
  factory: () => '/api/site-details',
});

/**
 * Absolute (server) or relative (browser) URL used to load Home Details content.
 */
export const HOME_DETAILS_API_URL = new InjectionToken<string>('HOME_DETAILS_API_URL', {
  factory: () => '/api/home-details',
});

/**
 * Default Crafter site used by browser-side direct content_store calls.
 */
export const CRAFTER_SITE_NAME = new InjectionToken<string>('CRAFTER_SITE_NAME', {
  factory: () => '',
});
