import { DATE_FORMATS } from "../constants/dates";
import { config } from "./params";

export function formatDate(date: Date): string {
  return DATE_FORMATS[config.metadata.dateFormat].format(date);
}
