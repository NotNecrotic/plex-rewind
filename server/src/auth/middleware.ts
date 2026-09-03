import type { NextFunction, Request, Response } from "express";
import {
  getSessionUser,
  type SessionUser,
} from "../auth/session.js";

export interface AuthedRequest extends Request {
  sessionUser: SessionUser;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const sessionUser = getSessionUser(sessionId);

  if (!sessionUser) {
    res.clearCookie("session");
    res.status(401).json({ error: "Session expired" });
    return;
  }

  (req as AuthedRequest).sessionUser = sessionUser;

  next();
}

export function sessionUserOf(req: Request): SessionUser {
  return (req as AuthedRequest).sessionUser;
}
