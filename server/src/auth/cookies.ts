import { Response, Request, CookieOptions } from "express";
import { env } from "../config/env.js";
import { SECURITY_CONFIG } from "../config/security.js";

const isProduction = env.NODE_ENV === "production";

export function getCookieNames(): {
  accessCookieName: string;
  refreshCookieName: string;
} {
  const prefix = isProduction ? "__Host-" : "";
  return {
    accessCookieName: `${prefix}${SECURITY_CONFIG.cookies.accessTokenName}`,
    refreshCookieName: `${prefix}${SECURITY_CONFIG.cookies.refreshTokenName}`,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const { accessCookieName, refreshCookieName } = getCookieNames();

  const baseOptions: CookieOptions = {
    httpOnly: true,
    sameSite: SECURITY_CONFIG.cookies.sameSite,
    secure: isProduction,
    path: SECURITY_CONFIG.cookies.path,
  };

  // 1. Access Token Cookie (15 minutes)
  res.cookie(accessCookieName, accessToken, {
    ...baseOptions,
    maxAge: SECURITY_CONFIG.tokens.accessTokenExpirySeconds * 1000,
  });

  // 2. Refresh Token Cookie (7 days)
  res.cookie(refreshCookieName, refreshToken, {
    ...baseOptions,
    maxAge: SECURITY_CONFIG.tokens.refreshTokenExpirySeconds * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  const { accessCookieName, refreshCookieName } = getCookieNames();

  const baseOptions: CookieOptions = {
    httpOnly: true,
    sameSite: SECURITY_CONFIG.cookies.sameSite,
    secure: isProduction,
    path: SECURITY_CONFIG.cookies.path,
  };

  res.clearCookie(accessCookieName, baseOptions);
  res.clearCookie(refreshCookieName, baseOptions);
}

export function getTokensFromCookies(req: Request): {
  accessToken?: string;
  refreshToken?: string;
} {
  const { accessCookieName, refreshCookieName } = getCookieNames();

  const cookies = req.cookies as Record<string, string> | undefined;
  const signedCookies = req.signedCookies as Record<string, string> | undefined;

  const accessToken =
    cookies?.[accessCookieName] ||
    signedCookies?.[accessCookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  const refreshToken =
    cookies?.[refreshCookieName] ||
    signedCookies?.[refreshCookieName];

  return { accessToken, refreshToken };
}
