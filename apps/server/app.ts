import { createApp, setResponseHeader, setResponseStatus } from "h3";
import type { AppConfig } from "./config.js";
import { contextMiddleware } from "./middleware/context.js";
import { corsMiddleware } from "./middleware/cors.js";
import { createApiRouter } from "./routes/index.js";

export function createApiApp(config: AppConfig) {
  const app = createApp({
    onError(error, event) {
      const requestId = event.context.requestId;

      const statusCode =
        error instanceof Error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 500;

      setResponseStatus(event, statusCode || 500);
      setResponseHeader(event, "content-type", "application/json");

      return {
        code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
        message: error instanceof Error ? error.message : "Unhandled error",
        requestId,
      };
    },
  });

  app.use(contextMiddleware(config));
  app.use(corsMiddleware(config));
  app.use(createApiRouter());

  return app;
}
