import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const SITE_DETAILS_UPSTREAM_URL = `${process.env['SITE_DETAILS_UPSTREAM_URL']}/api/1/site/content_store/item.json?url=/site/website/index.xml`;

if (!SITE_DETAILS_UPSTREAM_URL) {
  throw new Error('Missing SITE_DETAILS_UPSTREAM_URL environment variable.');
}

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */
app.get('/api/site-details', async (_req, res, next) => {
  try {
    const upstreamResponse = await fetch(SITE_DETAILS_UPSTREAM_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).send(payload);
      return;
    }

    res.setHeader(
      'content-type',
      upstreamResponse.headers.get('content-type') ?? 'application/json;charset=UTF-8',
    );
    res.setHeader('cache-control', 'no-store');
    res.status(200).send(payload);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
