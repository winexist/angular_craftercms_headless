import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const crafterContentUrl =
  process.env['CRAFTERCMS_CONTENT_URL'] ||
  'http://localhost:8080/api/1/site/content.json?crafterSite=mysite&path=/site/website/index.xml';

const app = express();
const angularApp = new AngularNodeAppEngine();

type CrafterPayload = {
  title: string;
  body: string;
};

const firstString = (...values: unknown[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();

const normalizeCrafterPayload = (payload: unknown): CrafterPayload => {
  const candidate = typeof payload === 'object' && payload ? (payload as Record<string, unknown>) : {};
  const item =
    typeof candidate['item'] === 'object' && candidate['item']
      ? (candidate['item'] as Record<string, unknown>)
      : undefined;

  return {
    title:
      firstString(
        candidate['title'],
        candidate['pageTitle'],
        item?.['title'],
        item?.['pageTitle'],
        item?.['internalName'],
      ) || 'CrafterCMS Headless Site',
    body:
      firstString(candidate['body'], candidate['description'], item?.['body'], item?.['description']) ||
      'Content is currently unavailable.',
  };
};

/**
 * Pull homepage content from headless CrafterCMS.
 */
app.get('/api/content', async (_req, res) => {
  try {
    const response = await fetch(crafterContentUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CrafterCMS responded with ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    res.json(normalizeCrafterPayload(payload));
  } catch (error) {
    console.error('Unable to fetch CrafterCMS content:', error);
    res.status(502).json({
      title: 'CrafterCMS Headless Site',
      body: 'Content is currently unavailable.',
    });
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
