import { CONSENT_LEGAL_LINKS } from "../constants/consent";
import { params } from "./params";

export function consentLegalLinks() {
  const links = params.consent?.options.legalLinks;
  return CONSENT_LEGAL_LINKS.filter((name) => links?.[name]);
}
