# Solace MongoDB Implementation & Query Guide

This guide is designed for implementing the native MongoDB repository methods in `server/src/repositories/mongo/*`.

---

## 1. User Queries (`MongoUserRepository.ts`)

```javascript
// findByEmail (normalized lowercase)
db.users.findOne({ email: email.toLowerCase() });

// recordFailedLogin & automatic lockout
db.users.findOneAndUpdate(
  { _id: ObjectId(id) },
  {
    $inc: { failedLoginCount: 1 },
    $set: { lockUntil: lockUntilDate, updatedAt: new Date().toISOString() }
  },
  { returnDocument: "after" }
);

// resetFailedLogins
db.users.updateOne(
  { _id: ObjectId(id) },
  { $set: { failedLoginCount: 0, lockUntil: null, updatedAt: new Date().toISOString() } }
);

// incrementTokenVersion (session revocation)
db.users.findOneAndUpdate(
  { _id: ObjectId(id) },
  { $inc: { tokenVersion: 1 }, $set: { updatedAt: new Date().toISOString() } },
  { returnDocument: "after" }
);
```

---

## 2. Policy Queries & DAC (`MongoPolicyRepository.ts`)

```javascript
// Scoped listing with DAC shared access support
// For customer: owner OR in sharedWith array
db.policies.find({
  $or: [
    { customerId: userId },
    { "sharedWith.userId": userId }
  ],
  ...(status && { status }),
  ...(type && { type })
}).sort({ createdAt: -1 });

// addSharedAccess (atomic append after ownership verification)
db.policies.findOneAndUpdate(
  { _id: ObjectId(policyId), customerId: ownerCustomerId },
  {
    $push: { sharedWith: shareObject },
    $set: { updatedAt: new Date().toISOString() }
  },
  { returnDocument: "after" }
);

// removeSharedAccess (atomic pull)
db.policies.findOneAndUpdate(
  { _id: ObjectId(policyId), customerId: ownerCustomerId },
  {
    $pull: { sharedWith: { userId: targetUserId } },
    $set: { updatedAt: new Date().toISOString() }
  },
  { returnDocument: "after" }
);
```

---

## 3. Claim Queries & MAC (`MongoClaimRepository.ts`)

```javascript
// Scoped listing with MAC clearance level filtering
// For adjuster: only claims where classificationLevel <= adjusterClearance
db.claims.find({
  classificationLevel: { $lte: adjusterClearanceLevel },
  ...(status && { currentStatus: status })
}).sort({ createdAt: -1 });

// updateStatus with optimistic concurrency check
db.claims.findOneAndUpdate(
  {
    _id: ObjectId(id),
    ...(expectedCurrentStatus && { currentStatus: expectedCurrentStatus })
  },
  {
    $set: {
      currentStatus: newStatus,
      updatedAt: new Date().toISOString()
    },
    $push: { statusHistory: historyItem }
  },
  { returnDocument: "after" }
);

// addAdjusterNote
db.claims.findOneAndUpdate(
  { _id: ObjectId(id) },
  {
    $push: { adjusterNotes: noteObject },
    $set: { updatedAt: new Date().toISOString() }
  },
  { returnDocument: "after" }
);
```

---

## 4. Payment Queries (`MongoPaymentRepository.ts`)

```javascript
// Atomic payment insert (enforcing 1:1 claim constraint)
db.payments.insertOne({
  claimId: claimId,
  amount: amount,
  method: method,
  reference: reference,
  paidAt: new Date().toISOString(),
  recordedBy: adjusterId,
  createdAt: new Date().toISOString()
});
```

---

## 5. Analytics Aggregation Pipelines (`modules/analytics/service.ts`)

### Pipeline 1: KPI Summary
```javascript
db.claims.aggregate([
  {
    $facet: {
      totalClaims: [{ $count: "count" }],
      decidedClaims: [
        { $match: { currentStatus: { $in: ["Approved", "Rejected", "Paid"] } } },
        {
          $group: {
            _id: null,
            totalDecided: { $sum: 1 },
            approvedCount: {
              $sum: { $cond: [{ $in: ["$currentStatus", ["Approved", "Paid"]] }, 1, 0] }
            }
          }
        }
      ]
    }
  }
]);
```

### Pipeline 2: Claims Grouped by Status
```javascript
db.claims.aggregate([
  {
    $group: {
      _id: "$currentStatus",
      count: { $sum: 1 }
    }
  }
]);
```

### Pipeline 3: Total Payouts Grouped by Policy Type
```javascript
db.payments.aggregate([
  {
    $lookup: {
      from: "claims",
      localField: "claimId",
      foreignField: "_id",
      as: "claim"
    }
  },
  { $unwind: "$claim" },
  {
    $lookup: {
      from: "policies",
      localField: "claim.policyId",
      foreignField: "_id",
      as: "policy"
    }
  },
  { $unwind: "$policy" },
  {
    $group: {
      _id: "$policy.type",
      totalAmount: { $sum: "$amount" }
    }
  }
]);
```
