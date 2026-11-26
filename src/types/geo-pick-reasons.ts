export type GeoPickReasonShare = { reason: string; count: number; share: number };

export type GeoPickReasonsResponse = {
  configured: boolean;
  pending: number;
  brands: {
    brand: string;
    own: boolean;
    picks: number;
    reasons: GeoPickReasonShare[];
    engines: { engine: string; picks: number; reasons: GeoPickReasonShare[] }[];
  }[];
};

export type GeoPickReasonEvidenceResponse = {
  evidence: {
    checkId: string;
    promptId: string;
    prompt: string;
    engine: string;
    capturedAt: string;
    pick: string;
    quote: string;
  }[];
};
