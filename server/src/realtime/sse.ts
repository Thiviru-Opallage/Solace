import { Router, Request, Response } from "express";
import type { ChangeFeed, ChangeEvent } from "./changeFeed.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { logger } from "../utils/logger.js";

/**
 * Writes a single SSE data frame.
 */
function sendSseEvent(res: Response, data: unknown, eventName?: string): void {
  if (eventName) {
    res.write(`event: ${eventName}\n`);
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Sets the mandatory SSE response headers and flushes them immediately so
 * the client receives the 200 before any events arrive.
 */
function initSseResponse(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx proxy buffering
  res.flushHeaders();
}

/**
 * Starts a heartbeat interval that sends SSE comment lines to keep the
 * connection alive through HTTP proxies.  Returns a cleanup function.
 */
function startHeartbeat(res: Response, onError: () => void): NodeJS.Timeout {
  return setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      onError();
    }
  }, SECURITY_CONFIG.realtime.heartbeatIntervalMs);
}

/**
 * Registers SSE routes on the provided router:
 *
 *   GET /events          — broadcasts every claim ChangeEvent (adjuster queue)
 *   GET /events/:claimId — broadcasts ChangeEvents for a single claim
 *
 * ⚠️  /events MUST be registered before /events/:claimId to avoid Express
 * treating "events" as the :claimId parameter value.
 */
export function setupSseRoutes(router: Router, changeFeed: ChangeFeed): void {
  // ── GET /events ─────────────────────────────────────────────────────────
  // Streams all claim entity changes to the adjuster queue view.
  router.get("/events", (req: Request, res: Response) => {
    initSseResponse(res);
    sendSseEvent(res, { type: "connected", timestamp: new Date().toISOString() }, "connected");

    const claimFilter = (event: ChangeEvent): boolean => event.entity === "claim";

    const unsubscribe = changeFeed.subscribe(claimFilter, (event: ChangeEvent) => {
      try {
        sendSseEvent(res, event);
      } catch (err) {
        logger.warn({ err }, "SSE write error — /events");
      }
    });

    let heartbeatTimer: NodeJS.Timeout;

    const cleanup = (): void => {
      clearInterval(heartbeatTimer);
      unsubscribe();
    };

    heartbeatTimer = startHeartbeat(res, cleanup);

    req.on("close", () => {
      cleanup();
      logger.debug({ userId: req.user?._id }, "SSE /events — client disconnected");
    });
  });

  // ── GET /events/:claimId ─────────────────────────────────────────────────
  // Streams ChangeEvents scoped to a single claim (live claim tracking).
  router.get("/events/:claimId", (req: Request, res: Response) => {
    const claimId = req.params["claimId"];

    if (!claimId) {
      res.status(400).json({ code: "BAD_REQUEST", message: "claimId is required" });
      return;
    }

    initSseResponse(res);
    sendSseEvent(
      res,
      { type: "connected", claimId, timestamp: new Date().toISOString() },
      "connected"
    );

    const claimFilter = (event: ChangeEvent): boolean =>
      event.entity === "claim" && event.entityId === claimId;

    const unsubscribe = changeFeed.subscribe(claimFilter, (event: ChangeEvent) => {
      try {
        sendSseEvent(res, event);
      } catch (err) {
        logger.warn({ err, claimId }, "SSE write error — /events/:claimId");
      }
    });

    let heartbeatTimer: NodeJS.Timeout;

    const cleanup = (): void => {
      clearInterval(heartbeatTimer);
      unsubscribe();
    };

    heartbeatTimer = startHeartbeat(res, cleanup);

    req.on("close", () => {
      cleanup();
      logger.debug(
        { userId: req.user?._id, claimId },
        "SSE /events/:claimId — client disconnected"
      );
    });
  });
}
