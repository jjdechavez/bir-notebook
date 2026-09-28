// Minimal stub of @opentelemetry/semantic-conventions.
// better-auth (@better-auth/core instrumentation) imports ONLY these four
// attribute-name constants. The real package is ~11MB; these are plain strings
// with identical values, so telemetry attribute keys are unchanged if enabled.
// If a better-auth upgrade imports additional constants, module load fails
// loudly with ERR_MODULE_NOT_FOUND / missing export — re-verify and extend here.
export const ATTR_DB_COLLECTION_NAME = "db.collection.name";
export const ATTR_DB_OPERATION_NAME = "db.operation.name";
export const ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
export const ATTR_HTTP_ROUTE = "http.route";
