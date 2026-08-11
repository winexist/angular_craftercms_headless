import { InjectionToken } from '@angular/core';

/**
 * Absolute (server) or relative (browser) URL used to load the Site Details content.
 * On the server it points to the local Express proxy so SSR never depends on the
 * incoming request's Host header (which is rewritten by the CrafterCMS preview proxy).
 */
export const SITE_DETAILS_API_URL = new InjectionToken<string>('SITE_DETAILS_API_URL', {
  factory: () => '/api/site-details',
});
