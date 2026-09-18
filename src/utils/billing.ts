import { BILLABLE_OPERATION_IDS } from '../constants/billing';
import { OPENAPI_OPERATIONS } from '../constants/openapi';

/**
 * Whether a raw `api request` targets a billable operation, by matching the
 * request path against the OpenAPI templates of the billable operations.
 */
export function isBillableRequest(method: string, path: string): boolean {
  const pathname = path.split('?')[0] ?? path;
  return OPENAPI_OPERATIONS.some(
    (operation) =>
      BILLABLE_OPERATION_IDS.has(operation.id) &&
      operation.method === method.toUpperCase() &&
      pathTemplateToRegExp(operation.path).test(pathname),
  );
}

function pathTemplateToRegExp(template: string): RegExp {
  const pattern = template
    .split('/')
    .map((segment) =>
      segment.startsWith('{') && segment.endsWith('}')
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${pattern}$`);
}
