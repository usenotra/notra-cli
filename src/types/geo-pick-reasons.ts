export type GeoPickReasonShare = { reason: string; count: number; share: number };

export type GeoPickReasonTotals = {
  picks: number;
  reasons: GeoPickReasonShare[];
  engines: { engine: string; picks: number; reasons: GeoPickReasonShare[] }[];
};

export type GeoPickReasonsResponse = {
  configured: boolean;
  pending: number;
  /** Analyzed answers; your picks out of these is how often AI picks you. */
  answers?: number;
  /** Every brand's picks pooled: what makes AI pick a product at all. */
  category?: GeoPickReasonTotals;
  brands: (GeoPickReasonTotals & { brand: string; own: boolean })[];
};

export type GeoPickReasonEvidenceResponse = {
  evidence: {
    checkId: string;
    scanId: string;
    brand: string;
    promptId: string;
    prompt: string;
    engine: string;
    capturedAt: string;
    pick: string;
    quote: string;
  }[];
};

export type GeoPickRequestRow = {
  request: string;
  answers: number;
  noSingleChoice: number;
  brands: { brand: string; own: boolean; picks: number; rate: number }[];
};

export type GeoPickRequestsResponse = {
  configured: boolean;
  unlabeledPrompts: number;
  overall: GeoPickRequestRow;
  requests: GeoPickRequestRow[];
};
