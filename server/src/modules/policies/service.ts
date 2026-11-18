import {
  PolicyEntity,
  UserEntity,
  PolicyScope,
  SharedAccess,
} from "../../repositories/types.js";
import { repositories } from "../../repositories/index.js";
import { PolicyFilterCriteria } from "../../repositories/IPolicyRepository.js";
import { checkPolicyOwnership, checkPolicyMutability, checkDacGrantLimit } from "../../authz/dac.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../../utils/errors.js";
import { sanitizeText } from "../../utils/sanitize.js";
import { CreatePolicyInput, UpdatePolicyInput, RequestPolicyInput } from "./schemas.js";

export class PolicyService {
  /**
   * Lists policies scoped to the requesting user's role and access.
   */
  async list(
    scope: PolicyScope,
    filters: {
      customerId?: string;
      agentId?: string;
      type?: PolicyEntity["type"];
      status?: PolicyEntity["status"];
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PolicyEntity[]> {
    const criteria: PolicyFilterCriteria = {
      scope,
      customerId: filters.customerId,
      agentId: filters.agentId,
      type: filters.type,
      status: filters.status,
      search: filters.search ? sanitizeText(filters.search) : undefined,
      limit: filters.limit,
      skip: filters.offset,
    };
    return repositories.policies.find(criteria);
  }

  /**
   * Fetches a single policy by ID and enforces DAC read access.
   */
  async getById(id: string, user: UserEntity): Promise<PolicyEntity> {
    const policy = await repositories.policies.findById(id);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    // Enforce DAC: customers must own or have shared access
    checkPolicyOwnership(policy, user);

    return policy;
  }

  /**
   * Creates a new policy (agents only at the route level).
   * Generates a sequential policy number and writes an audit log.
   */
  async create(input: CreatePolicyInput, agentId: string): Promise<PolicyEntity> {
    const seq = await repositories.counters.getNextSequence("policy");
    const policyNumber = `POL-${String(seq).padStart(6, "0")}`;

    const policy = await repositories.policies.create({
      policyNumber,
      type: input.type,
      customerId: input.customerId,
      agentId,
      coverage: input.coverage,
      premium: input.premium,
      renewalDate: input.renewalDate,
      status: "active",
      details: input.details,
      sharedWith: [],
    });

    await repositories.auditLogs.create({
      action: "POLICY_CREATE",
      actorId: agentId,
      actorRole: "agent",
      targetId: policy._id,
      targetType: "policy",
      details: { policyNumber: policy.policyNumber, customerId: input.customerId },
      timestamp: new Date().toISOString(),
    });

    return policy;
  }

  /**
   * Customer requests a new policy (status set to 'pending' for review).
   */
  async requestPolicy(input: RequestPolicyInput, user: UserEntity): Promise<PolicyEntity> {
    if (user.role !== "customer") {
      throw new ForbiddenError("Only customers can submit policy requests");
    }

    const seq = await repositories.counters.getNextSequence("policy");
    const policyNumber = `REQ-${String(seq).padStart(4, "0")}`;

    let details: any;
    if (input.type === "motor") {
      details = {
        type: "motor",
        motor: {
          make: "Requested Vehicle",
          model: input.note || "Standard Comprehensive",
          registrationNumber: "PENDING-REG",
          manufactureYear: 2024,
        },
      };
    } else if (input.type === "health") {
      details = {
        type: "health",
        health: {
          dependents: [],
          network: "Comprehensive",
          roomType: "Private",
        },
      };
    } else if (input.type === "home") {
      details = {
        type: "home",
        home: {
          propertyAddress: input.note || "Customer Residence",
          propertyValue: input.coverageAmount,
          constructionYear: 2022,
        },
      };
    } else {
      details = {
        type: "travel",
        travel: {
          destination: input.note || "Worldwide Travel",
          departureDate: "2026-11-01",
          returnDate: "2026-11-15",
          travellersCount: 1,
        },
      };
    }

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const policy = await repositories.policies.create({
      policyNumber,
      type: input.type,
      customerId: user._id,
      agentId: "",
      coverage: {
        amount: input.coverageAmount,
        deductible: Math.max(1000, Math.round(input.coverageAmount * 0.01)),
      },
      premium: {
        amount: Math.max(1500, Math.round(input.coverageAmount * 0.02)),
        frequency: "monthly",
      },
      renewalDate: nextYear.toISOString(),
      status: "pending",
      details,
      sharedWith: [],
    });

    await repositories.auditLogs.create({
      action: "POLICY_REQUEST",
      actorId: user._id,
      actorRole: user.role,
      targetId: policy._id,
      targetType: "policy",
      details: { policyNumber, requestedType: input.type, coverageAmount: input.coverageAmount },
      timestamp: new Date().toISOString(),
    });

    return policy;
  }

  /**
   * Approves and activates a requested policy (adjuster or agent).
   */
  async approvePolicy(id: string, actor: UserEntity): Promise<PolicyEntity> {
    if (actor.role !== "adjuster" && actor.role !== "agent") {
      throw new ForbiddenError("Only adjusters or agents can approve policies");
    }

    const policy = await repositories.policies.findById(id);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    const prefix = policy.type === "motor" ? "MO" : policy.type === "health" ? "HE" : policy.type === "home" ? "HO" : "TR";
    const seq = await repositories.counters.getNextSequence("policy");
    const officialNumber = `${prefix}-${String(seq).padStart(4, "0")}`;

    const updates: Partial<PolicyEntity> = {
      status: "active",
      policyNumber: officialNumber,
    };
    if (actor.role === "agent" && (!policy.agentId || policy.agentId === "")) {
      updates.agentId = actor._id;
    }

    const updated = await repositories.policies.update(id, updates);

    if (!updated) {
      throw new NotFoundError("Policy not found");
    }

    await repositories.auditLogs.create({
      action: "POLICY_APPROVE",
      actorId: actor._id,
      actorRole: actor.role,
      targetId: id,
      targetType: "policy",
      details: { officialNumber, previousNumber: policy.policyNumber },
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Updates a policy after DAC mutability check.
   */
  async update(
    id: string,
    updates: UpdatePolicyInput,
    user: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<PolicyEntity> {
    const policy = await repositories.policies.findById(id);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    checkPolicyMutability(policy, user);

    const updated = await repositories.policies.update(id, updates);
    if (!updated) {
      throw new NotFoundError("Policy not found");
    }

    await repositories.auditLogs.create({
      action: "POLICY_UPDATE",
      actorId: user._id,
      actorRole: user.role,
      targetId: id,
      targetType: "policy",
      details: { fields: Object.keys(updates) },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Shares a policy with another customer by their email address.
   * Enforces: owner-only, target must be a customer, no self-share, no duplicates, DAC limit.
   */
  async sharePolicy(
    policyId: string,
    targetEmail: string,
    requestingUser: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<PolicyEntity> {
    const policy = await repositories.policies.findById(policyId);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    // Only the owner customer can share
    if (policy.customerId !== requestingUser._id) {
      throw new ForbiddenError("Only the policy owner can share this policy");
    }

    const targetUser = await repositories.users.findByEmail(targetEmail);
    if (!targetUser) {
      throw new NotFoundError("No user found with that email address");
    }

    if (targetUser._id === requestingUser._id) {
      throw new ConflictError("Cannot share a policy with yourself");
    }

    if (targetUser.role !== "customer") {
      throw new ConflictError("Policy can only be shared with customers");
    }

    const alreadyShared = policy.sharedWith.some((s) => s.userId === targetUser._id);
    if (alreadyShared) {
      throw new ConflictError("Policy is already shared with this user");
    }

    checkDacGrantLimit(policy);

    const share: SharedAccess = {
      userId: targetUser._id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      grantedAt: new Date().toISOString(),
      permission: "read",
    };

    const updated = await repositories.policies.addSharedAccess(policyId, share, requestingUser._id);
    if (!updated) {
      throw new NotFoundError("Policy not found");
    }

    await repositories.auditLogs.create({
      action: "POLICY_SHARE",
      actorId: requestingUser._id,
      actorRole: requestingUser.role,
      targetId: policyId,
      targetType: "policy",
      details: { sharedWithUserId: targetUser._id, sharedWithEmail: targetEmail },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Revokes shared access to a policy.
   * Only the policy owner can revoke.
   */
  async revokeShare(
    policyId: string,
    targetUserId: string,
    requestingUser: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<PolicyEntity> {
    const policy = await repositories.policies.findById(policyId);
    if (!policy) {
      throw new NotFoundError("Policy not found");
    }

    if (policy.customerId !== requestingUser._id) {
      throw new ForbiddenError("Only the policy owner can revoke shared access");
    }

    const updated = await repositories.policies.removeSharedAccess(
      policyId,
      targetUserId,
      requestingUser._id
    );
    if (!updated) {
      throw new NotFoundError("Policy not found or user not in sharedWith");
    }

    await repositories.auditLogs.create({
      action: "POLICY_SHARE_REVOKE",
      actorId: requestingUser._id,
      actorRole: requestingUser.role,
      targetId: policyId,
      targetType: "policy",
      details: { revokedFromUserId: targetUserId },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}

export const policyService = new PolicyService();
