import type { Request, Response, NextFunction } from "express";
import { sessionService } from "./session.service";
import { StartSessionSchema } from "./session.model";

export const sessionController = {
  /** POST /sessions/start — tutor starts a live session */
  start: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = StartSessionSchema.parse(req.body);
      const data = await sessionService.startSession(
        bookingId,
        req.user!.user_id,
        req.user!.tenant_id
      );
      res.status(201).json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /** POST /sessions/:id/join — student joins a live session */
  join: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await sessionService.joinSession(
        Number(req.params.id),
        req.user!.user_id,
        req.user!.tenant_id
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /** POST /sessions/:id/end — tutor ends the session */
  end: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await sessionService.endSession(
        Number(req.params.id),
        req.user!.user_id,
        req.user!.tenant_id
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /** GET /sessions/:id — get session details (reconnect/polling) */
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await sessionService.getSession(
        Number(req.params.id),
        req.user!.tenant_id
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /** GET /sessions/my — tutor views own session history */
  getMy: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await sessionService.getMySessions(
        req.user!.user_id,
        req.user!.tenant_id
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },
};
