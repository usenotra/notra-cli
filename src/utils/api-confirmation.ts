import { API_ACTION_CONFIRMATIONS } from '../constants/api-commands';
import { BILLABLE_OPERATION_IDS } from '../constants/billing';
import { OPENAPI_OPERATIONS } from '../constants/openapi';
import type { OpenApiOperation } from '../types/openapi';

export function getOperationConfirmation(operation: OpenApiOperation): string | undefined {
  const confirmation = API_ACTION_CONFIRMATIONS[operation.id];
  if (confirmation) return confirmation;
  if (operation.method === 'DELETE') return `${operation.summary}?`;
  if (BILLABLE_OPERATION_IDS.has(operation.id)) return `Run billable operation ${operation.id}?`;
}

export function getRequestConfirmation(method: string, path: string): string | undefined {
  const normalizedMethod = method.toUpperCase();
  const { pathname } = new URL(path.replace(/^\/+/, ''), 'https://api.usenotra.com/');
  const operation = OPENAPI_OPERATIONS.find(
    (operation) =>
      operation.method === normalizedMethod &&
      pathTemplateToRegExp(operation.path).test(pathname),
  );
  if (operation) return getOperationConfirmation(operation);
  if (normalizedMethod === 'DELETE') return `Send DELETE request to ${pathname}?`;
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
