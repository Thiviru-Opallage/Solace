import { ClaimEntity } from "../../repositories/types.js";

/**
 * Frontend-facing Claim DTO.
 * Strips classificationLevel (internal security field) — only the human-readable
 * classification string is exposed to clients.
 */
export interface ClaimDto {
  _id: string;
  claimNumber: string;
  policyId: string;
  customerId: string;
  incident: ClaimEntity["incident"];
  claimedAmount: number;
  classification: ClaimEntity["classification"];
  documents: ClaimEntity["documents"];
  adjusterNotes: ClaimEntity["adjusterNotes"];
  statusHistory: ClaimEntity["statusHistory"];
  currentStatus: ClaimEntity["currentStatus"];
  createdAt: string;
}

export function toClaimDto(entity: ClaimEntity): ClaimDto {
  return {
    _id: entity._id,
    claimNumber: entity.claimNumber,
    policyId: entity.policyId,
    customerId: entity.customerId,
    incident: entity.incident,
    claimedAmount: entity.claimedAmount,
    classification: entity.classification,
    documents: entity.documents,
    adjusterNotes: entity.adjusterNotes,
    statusHistory: entity.statusHistory,
    currentStatus: entity.currentStatus,
    createdAt: entity.createdAt,
  };
}
