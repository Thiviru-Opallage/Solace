import { PolicyEntity } from "../../repositories/types.js";

/**
 * Frontend-facing Policy DTO.
 * Strips internal fields (updatedAt) and maps the entity to the wire format.
 */
export interface PolicyDto {
  _id: string;
  policyNumber: string;
  type: PolicyEntity["type"];
  customerId: string;
  agentId: string;
  coverage: PolicyEntity["coverage"];
  premium: PolicyEntity["premium"];
  renewalDate: string;
  status: PolicyEntity["status"];
  details: PolicyEntity["details"];
  sharedWith: PolicyEntity["sharedWith"];
  createdAt: string;
}

export function toPolicyDto(entity: PolicyEntity): PolicyDto {
  return {
    _id: entity._id,
    policyNumber: entity.policyNumber,
    type: entity.type,
    customerId: entity.customerId,
    agentId: entity.agentId,
    coverage: entity.coverage,
    premium: entity.premium,
    renewalDate: entity.renewalDate,
    status: entity.status,
    details: entity.details,
    sharedWith: entity.sharedWith,
    createdAt: entity.createdAt,
  };
}
