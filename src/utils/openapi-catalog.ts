import { OPENAPI_HTTP_METHODS } from '../constants/openapi-config';
import type { OperationRequestSchema } from '../types/api-command';
import type { OpenApiOperation } from '../types/openapi';
import { isRecord } from './records';
import { resolveOpenApiSchema } from './openapi-schema';

export function buildOpenApiCatalog(document: unknown) {
  if (!isRecord(document) || !isRecord(document.paths)) {
    throw new Error('OpenAPI document does not contain a paths object.');
  }
  const operations: OpenApiOperation[] = [];
  const requests = new Map<string, OperationRequestSchema>();
  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!isRecord(pathItem)) continue;
    for (const [methodName, operation] of Object.entries(pathItem)) {
      const method = Object.hasOwn(OPENAPI_HTTP_METHODS, methodName) ? OPENAPI_HTTP_METHODS[methodName] : undefined;
      if (!method || !isRecord(operation) || typeof operation.operationId !== 'string') continue;
      const id = operation.operationId;
      if (requests.has(id)) throw new Error(`Duplicate OpenAPI operation ID: ${id}`);
      const request: OperationRequestSchema = { parameters: {} };
      const parameters: OpenApiOperation['parameters'][number][] = [];
      for (const parameter of Array.isArray(operation.parameters) ? operation.parameters : []) {
        if (!isRecord(parameter) || typeof parameter.name !== 'string') continue;
        if (parameter.in !== 'path' && parameter.in !== 'query' && parameter.in !== 'header') continue;
        request.parameters[parameter.name] = resolveOpenApiSchema(parameter.schema, document);
        parameters.push({ name: parameter.name, in: parameter.in, required: parameter.required === true });
      }
      const body = isRecord(operation.requestBody) ? operation.requestBody : undefined;
      const content = body && isRecord(body.content) ? body.content : undefined;
      const json = content && isRecord(content['application/json']) ? content['application/json'] : undefined;
      if (json) request.body = resolveOpenApiSchema(json.schema, document);
      requests.set(id, request);
      operations.push({
        id, method, path,
        summary: typeof operation.summary === 'string' ? operation.summary : id,
        tag: Array.isArray(operation.tags) && typeof operation.tags[0] === 'string' ? operation.tags[0] : '',
        parameters, hasBody: operation.requestBody !== undefined,
      });
    }
  }
  operations.sort((left, right) => left.id.localeCompare(right.id));
  return { operations, requests: Object.fromEntries([...requests].sort(([left], [right]) => left.localeCompare(right))) };
}
