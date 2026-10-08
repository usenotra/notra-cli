import { fromJSONSchema, ZodObject } from 'zod';
import { OPENAPI_REQUEST_SCHEMAS } from '../constants/openapi';

export function operationBodySchema(id: string): ZodObject {
  const schema = OPENAPI_REQUEST_SCHEMAS[id]?.body;
  if (!schema) throw new Error(`No bundled request body for operation: ${id}`);
  const validator = fromJSONSchema(schema);
  if (!(validator instanceof ZodObject)) {
    throw new Error(`Operation ${id} must have an object request body.`);
  }
  return validator;
}
