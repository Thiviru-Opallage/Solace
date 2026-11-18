import { randomUUID } from "node:crypto";
import {
  ClaimEntity,
  ClaimScope,
  ClaimStatus,
  UserEntity,
  AdjusterNote,
  StatusHistoryItem,
  ClaimDocument,
} from "../../repositories/types.js";
import { repositories } from "../../repositories/index.js";
import { ClaimFilterCriteria } from "../../repositories/IClaimRepository.js";
import { classifyClaim, checkMacAccess } from "../../authz/mac.js";
import { validateStatusTransition } from "../../services/statusMachine.js";
import { sanitizeText } from "../../utils/sanitize.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../utils/errors.js";
import { CreateClaimInput } from "./schemas.js";

export class ClaimsService {
  /**
   * Lists claims scoped to the requesting user's role and access.
   */
  async list(
    scope: ClaimScope,
    filters: {
      customerId?: string;
      policyId?: string;
      status?: ClaimStatus;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ClaimEntity[]> {
    const criteria: ClaimFilterCriteria = {
      scope,
      customerId: filters.customerId,
      policyId: filters.policyId,
      status: filters.status,
      search: filters.search ? sanitizeText(filters.search) : undefined,
      limit: filters.limit,
      skip: filters.offset,
    };
    return repositories.claims.find(criteria);
  }

  /**
   * Fetches a single claim by ID, enforcing MAC access for adjusters and
   * ownership/shared-access for customers.
   */
  async getById(id: string, user: UserEntity): Promise<ClaimEntity> {
    const claim = await repositories.claims.findById(id);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    if (user.role === "adjuster") {
      checkMacAccess(user, claim.classificationLevel);
    } else if (user.role === "customer") {
      const isOwner = claim.customerId === user._id;
      if (!isOwner) {
        // Check if they have access via a shared policy
        const policy = await repositories.policies.findById(claim.policyId);
        const hasSharedAccess = policy?.sharedWith.some((s) => s.userId === user._id) ?? false;
        if (!hasSharedAccess) {
          throw new ForbiddenError("You do not have access to this claim");
        }
      }
    }
    // Agents can see all claims (scope is enforced at repository layer)

    return claim;
  }

  /**
   * Creates a new claim for a customer.
   * Verifies policy access, MAC-classifies the amount, generates a sequential
   * claim number, and writes an audit log.
   */
  async create(input: CreateClaimInput, user: UserEntity): Promise<ClaimEntity> {
    if (user.role !== "customer") {
      throw new ForbiddenError("Only customers can create claims");
    }

    // Verify policy exists and customer has access
    const policy = await repositories.policies.findById(input.policyId);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    const isOwner = policy.customerId === user._id;
    const isShared = policy.sharedWith.some((s) => s.userId === user._id);
    if (!isOwner && !isShared) {
      throw new ForbiddenError("You do not have access to this policy");
    }

    // MAC classification
    const { classification, classificationLevel } = classifyClaim(input.claimedAmount);

    // Generate sequential claim number: CLM-YYYY-XXXX
    const seq = await repositories.counters.getNextSequence("claim");
    const year = new Date().getFullYear();
    const claimNumber = `CLM-${year}-${String(seq).padStart(4, "0")}`;

    const initialHistory: StatusHistoryItem = {
      status: "Pending",
      by: user.name,
      byRole: "customer",
      at: new Date().toISOString(),
    };

    const claim = await repositories.claims.create({
      claimNumber,
      policyId: input.policyId,
      customerId: input.customerId,
      incident: {
        date: input.incident.date,
        location: sanitizeText(input.incident.location, 300),
        description: sanitizeText(input.incident.description, 2000),
      },
      claimedAmount: input.claimedAmount,
      classification,
      classificationLevel,
      documents: (input.documents || []).map((d: any) => ({
        id: d.id || randomUUID(),
        fileName: d.fileName,
        url: d.url,
        type: d.type,
        fileSize: d.fileSize || "1.2 MB",
        uploadedAt: d.uploadedAt || new Date().toISOString(),
      })),
      adjusterNotes: [],
      statusHistory: [initialHistory],
      currentStatus: "Pending",
    });

    await repositories.auditLogs.create({
      action: "CLAIM_CREATE",
      actorId: user._id,
      actorRole: user.role,
      targetId: claim._id,
      targetType: "claim",
      details: { claimNumber, policyId: input.policyId, classification },
      timestamp: new Date().toISOString(),
    });

    return claim;
  }

  /**
   * Updates a claim's status after validating the transition via the status machine.
   * Enforces that a payment record must exist before marking a claim as 'Paid'.
   */
  async updateStatus(
    claimId: string,
    newStatus: ClaimStatus,
    user: UserEntity,
    comment?: string,
    ip?: string,
    userAgent?: string
  ): Promise<ClaimEntity> {
    const claim = await repositories.claims.findById(claimId);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    validateStatusTransition(claim.currentStatus, newStatus, user.role);

    // Require payment record to exist before marking Paid
    if (newStatus === "Paid") {
      const existingPayment = await repositories.payments.findByClaimId(claimId);
      if (!existingPayment) {
        throw new BadRequestError(
          "A payment record must be created before marking the claim as Paid"
        );
      }
    }

    const historyItem: StatusHistoryItem = {
      status: newStatus,
      by: user.name,
      byRole: user.role,
      at: new Date().toISOString(),
      comment,
    };

    const updated = await repositories.claims.updateStatus(
      claimId,
      newStatus,
      historyItem,
      claim.currentStatus
    );
    if (!updated) {
      throw new NotFoundError("Claim not found");
    }

    await repositories.auditLogs.create({
      action: "CLAIM_STATUS_UPDATE",
      actorId: user._id,
      actorRole: user.role,
      targetId: claimId,
      targetType: "claim",
      details: { from: claim.currentStatus, to: newStatus, comment },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Adds an adjuster note to a claim.
   * Only adjusters can add notes; MAC access is checked.
   */
  async addNote(
    claimId: string,
    noteText: string,
    adjuster: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<ClaimEntity> {
    if (adjuster.role !== "adjuster") {
      throw new ForbiddenError("Only adjusters can add notes to claims");
    }

    const claim = await repositories.claims.findById(claimId);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    checkMacAccess(adjuster, claim.classificationLevel);

    const note: AdjusterNote = {
      id: randomUUID(),
      adjusterId: adjuster._id,
      adjusterName: adjuster.name,
      note: sanitizeText(noteText, 2000),
      createdAt: new Date().toISOString(),
    };

    const updated = await repositories.claims.addNote(claimId, note);
    if (!updated) {
      throw new NotFoundError("Claim not found");
    }

    await repositories.auditLogs.create({
      action: "CLAIM_NOTE_ADD",
      actorId: adjuster._id,
      actorRole: adjuster.role,
      targetId: claimId,
      targetType: "claim",
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Allows a customer to respond to an information request.
   * The claim must be in 'Info Requested' status; transitions to 'Under Review'.
   */
  async respondToInfoRequest(
    claimId: string,
    responseText: string,
    user: UserEntity,
    documents: ClaimDocument[] = [],
    ip?: string,
    userAgent?: string
  ): Promise<ClaimEntity> {
    if (user.role !== "customer") {
      throw new ForbiddenError("Only customers can respond to information requests");
    }

    const claim = await repositories.claims.findById(claimId);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    if (claim.currentStatus !== "Info Requested") {
      throw new BadRequestError(
        `Claim must be in 'Info Requested' status to respond (current: '${claim.currentStatus}')`
      );
    }

    const historyItem: StatusHistoryItem = {
      status: "Under Review",
      by: user.name,
      byRole: "customer",
      at: new Date().toISOString(),
      comment: sanitizeText(responseText, 2000),
    };

    let updated: ClaimEntity | null;

    if (documents.length > 0) {
      updated = await repositories.claims.addDocuments(claimId, documents, historyItem, "Under Review");
    } else {
      updated = await repositories.claims.updateStatus(
        claimId,
        "Under Review",
        historyItem,
        "Info Requested"
      );
    }

    if (!updated) {
      throw new NotFoundError("Claim not found");
    }

    await repositories.auditLogs.create({
      action: "CLAIM_INFO_RESPONDED",
      actorId: user._id,
      actorRole: user.role,
      targetId: claimId,
      targetType: "claim",
      details: { documentsAdded: documents.length },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}

export const claimsService = new ClaimsService();
