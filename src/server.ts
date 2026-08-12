import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const HOME_PAGE_PATH = '/site/website/index.xml';
const SITE_DETAILS_PAGE_PATH = '/site/website/index.xml';
const crafterSite = process.env['CRAFTER_SITE'] ?? 'headless-empty';
const upstreamBaseUrl = process.env['CRAFTER_BASE_URL'] ?? 'http://localhost:8080';
const trustedProxyHeaders = (
  process.env['TRUST_PROXY_HEADERS'] ?? 'x-forwarded-for,x-forwarded-proto'
)
  .split(',')
  .map((header) => header.trim())
  .filter(Boolean);

const app = express();
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: trustedProxyHeaders,
});

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
const fetchCrafterContent = async (path: string) => {
  const params = new URLSearchParams({
    url: path,
    crafterSite,
  });

  return fetch(`${upstreamBaseUrl}/api/1/site/content_store/item.json?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });
};

app.get('/api/site-details', async (_req, res, next) => {
  try {
    const upstreamResponse = await fetchCrafterContent(SITE_DETAILS_PAGE_PATH);

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

app.get('/api/home-details', async (_req, res, next) => {
  try {
    const upstreamResponse = await fetchCrafterContent(HOME_PAGE_PATH);

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
