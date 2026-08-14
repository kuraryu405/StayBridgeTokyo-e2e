export type EvidenceResult = "PASS" | "FAIL" | "INFO";

export interface EvidenceStep {
  step: number;
  total?: number;
  acceptance?: string[];
  action: string;
  detail?: string;
  verify?: string;
}

export interface EvidenceCapture {
  scenario: string;
  name: string;
  acceptance?: string[];
  result?: EvidenceResult;
}

export interface EvidenceVerification {
  acceptance?: string[];
  description: string;
  capture?: Omit<EvidenceCapture, "acceptance" | "result">;
}

export interface EvidenceOverlayPayload {
  kind: "READY" | "STEP" | "NAVIGATION" | "VERIFY" | "PASS" | "FAIL";
  step?: number;
  total?: number;
  acceptance?: string[];
  action?: string;
  detail?: string;
  verify?: string;
  expected?: string;
  actual?: string;
  from?: string;
  to?: string;
}

export interface EvidenceStepRecord extends EvidenceStep {
  startedAt: string;
  finishedAt?: string;
  result?: EvidenceResult;
}
