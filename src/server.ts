import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';

const engine = new AngularNodeAppEngine({ allowedHosts: ['historyczny-rybnik-dev.web.app'] });
export const renderPlace = (request: Request, context: unknown) => engine.handle(request, context);

// Angular's builder requires a Node request handler entry point.
export const reqHandler = createNodeRequestHandler(async (request, response) => {
  const result = await engine.handle(request);
  if (result) await writeResponseToNodeResponse(result, response);
  else { response.statusCode = 404; response.end(); }
});
