import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { SECURITY_CONFIG } from "../../config/security.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import { ClaimDocument } from "../../repositories/types.js";
import { repositories } from "../../repositories/index.js";
import { toClaimDto } from "./dto.js";

function getParam(param: unknown): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return typeof param === "string" ? param : "";
}

// Storage directory on disk
const STORAGE_ROOT = path.resolve(process.cwd(), "storage");

// In-memory multer storage for magic-bytes verification prior to disk commit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SECURITY_CONFIG.uploads.maxFileSize, // 5MB
    files: SECURITY_CONFIG.uploads.maxFiles, // 5 files
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!SECURITY_CONFIG.uploads.allowedExtensions.includes(ext as (typeof SECURITY_CONFIG.uploads.allowedExtensions)[number])) {
      return cb(new BadRequestError(`File extension '${ext}' is not permitted.`));
    }
    cb(null, true);
  },
});

export const claimUploadMiddleware = upload.array("documents", SECURITY_CONFIG.uploads.maxFiles);

/**
 * Controller handler for document upload to a claim.
 * Performs MIME magic bytes check, saves to storage, and attaches documents to the claim.
 */
export async function uploadClaimDocuments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const claimId = getParam(req.params["id"]);
    const claim = await repositories.claims.findById(claimId);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new BadRequestError("No files uploaded");
    }

    const uploadedDocuments: ClaimDocument[] = [];
    const claimDir = path.join(STORAGE_ROOT, claimId);
    await fs.mkdir(claimDir, { recursive: true });

    for (const file of files) {
      // 1. Verify MIME type using magic bytes
      const detected = await fileTypeFromBuffer(file.buffer);
      const mime = detected?.mime ?? file.mimetype;

      const isAllowed = (SECURITY_CONFIG.uploads.allowedMimeTypes as readonly string[]).includes(mime);
      if (!isAllowed) {
        throw new BadRequestError(
          `File '${file.originalname}' has invalid or prohibited MIME type: ${mime}`
        );
      }

      // 2. Generate safe storage file name
      const ext = path.extname(file.originalname) || `.${detected?.ext || "bin"}`;
      const docId = randomUUID();
      const storedFileName = `${docId}${ext}`;
      const filePath = path.join(claimDir, storedFileName);

      // 3. Write to disk
      await fs.writeFile(filePath, file.buffer);

      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      uploadedDocuments.push({
        id: docId,
        fileName: file.originalname,
        url: `/api/claims/${claimId}/documents/${docId}`,
        type: mime,
        uploadedAt: new Date().toISOString(),
        fileSize: sizeStr,
        storedFileName,
      });
    }

    // 4. Attach documents to claim in database
    const updated = await repositories.claims.addDocuments(claimId, uploadedDocuments);

    // 5. Audit log
    await repositories.auditLogs.create({
      action: "CLAIM_DOCUMENTS_UPLOADED",
      actorId: req.user?._id,
      actorRole: req.user?.role,
      targetId: claimId,
      targetType: "claim",
      ipAddress: req.ip,
      userAgent: req.header("user-agent"),
      details: {
        documentCount: uploadedDocuments.length,
        fileNames: uploadedDocuments.map((d) => d.fileName),
      },
    });

    res.status(201).json({
      documents: uploadedDocuments,
      claim: updated ? toClaimDto(updated) : undefined,
    });
  } catch (err) {
    next(err);
  }
}
