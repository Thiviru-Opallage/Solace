import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { Role } from "../repositories/types.js";
import { UnauthorizedError } from "../utils/errors.js";

const encodedSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
  email: string;
  tokenVersion: number;
}

/**
 * Signs an access JWT using jose with algorithm pinned to HS256.
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    email: payload.email,
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: SECURITY_CONFIG.tokens.algorithm })
    .setSubject(payload.sub)
    .setIssuer(SECURITY_CONFIG.tokens.issuer)
    .setAudience(SECURITY_CONFIG.tokens.audience)
    .setIssuedAt()
    .setExpirationTime(SECURITY_CONFIG.tokens.accessTokenExpiryString)
    .sign(encodedSecret);
}

/**
 * Verifies an access JWT using jose with strict algorithm pinning.
 * Rejects expired tokens, invalid signatures, wrong audience/issuer, and "none" alg.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, encodedSecret, {
      algorithms: [SECURITY_CONFIG.tokens.algorithm], // Strictly pin algorithm
      issuer: SECURITY_CONFIG.tokens.issuer,
      audience: SECURITY_CONFIG.tokens.audience,
    });

    // Explicitly reject if header is not HS256
    if (protectedHeader.alg !== SECURITY_CONFIG.tokens.algorithm) {
      throw new UnauthorizedError("Invalid token algorithm");
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new UnauthorizedError("Malformed token subject");
    }

    return {
      sub: payload.sub,
      role: payload["role"] as Role,
      email: payload["email"] as string,
      tokenVersion: typeof payload["tokenVersion"] === "number" ? payload["tokenVersion"] : 1,
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Invalid or expired session token");
  }
}
