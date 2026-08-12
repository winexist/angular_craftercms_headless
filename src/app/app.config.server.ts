import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { HOME_DETAILS_API_URL, SITE_DETAILS_API_URL } from './tokens';

const serverPort = process.env['PORT'] ?? '4000';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: SITE_DETAILS_API_URL,
      useValue: `http://localhost:${serverPort}/api/site-details`,
    },
    {
      provide: HOME_DETAILS_API_URL,
      useValue: `http://localhost:${serverPort}/api/home-details`,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
