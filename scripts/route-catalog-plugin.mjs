import { catalogFromRepository } from './build-route-catalog.mjs';
import { routeCatalogFile } from '../js/hub-routes.js';

// Generate afresh; never check in or hand-edit a second registry of content.
export function routeCatalogPlugin() {
  return {
    name: 'learning-hub-route-catalog',
    async generateBundle() {
      const catalog = await catalogFromRepository();
      this.emitFile({ type: 'asset', fileName: routeCatalogFile, source: JSON.stringify(catalog, null, 2) + '\n' });
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (new URL(request.url, 'http://localhost').pathname !== '/' + routeCatalogFile) return next();
        response.setHeader('Cache-Control', 'no-store');
        try {
          const catalog = await catalogFromRepository();
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify(catalog));
        } catch (error) {
          server.config.logger.error(error.message);
          response.statusCode = 500;
          response.end('Route catalog is invalid. Check the development server log.');
        }
      });
    },
  };
}
