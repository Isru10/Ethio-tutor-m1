import type { Request, Response, NextFunction } from "express";
import { chatService } from "./chat.service";

export const chatController = {
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await chatService.getMyConversations(req.user!.user_id, req.user!.tenant_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  startConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) { res.status(400).json({ status: "error", message: "targetUserId required" }); return; }
      const data = await chatService.getOrCreateDirect(req.user!.user_id, Number(targetUserId), req.user!.tenant_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
      const data = await chatService.getMessages(Number(req.params.id), req.user!.user_id, req.user!.tenant_id, cursor);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, type } = req.body;
      if (!content?.trim()) { res.status(400).json({ status: "error", message: "content required" }); return; }
      const data = await chatService.sendMessage(Number(req.params.id), req.user!.user_id, content.trim(), type ?? "text", req.user!.tenant_id);
      res.status(201).json({ status: "success", data });
    } catch (err) { next(err); }
  },

  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await chatService.markRead(Number(req.params.id), req.user!.user_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  getChatableUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await chatService.getChatableUsers(req.user!.user_id, req.user!.tenant_id, req.user!.role);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  getUnreadCounts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await chatService.getUnreadCounts(req.user!.user_id, req.user!.tenant_id);
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },

  /**
   * POST /chat/broadcast — admin only
   * Body: { targetUserIds: number[], content: string }
   */
  broadcast: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserIds, content } = req.body;
      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        res.status(400).json({ status: "error", message: "targetUserIds must be a non-empty array" });
        return;
      }
      if (!content?.trim()) {
        res.status(400).json({ status: "error", message: "content required" });
        return;
      }
      const data = await chatService.broadcastMessage(
        req.user!.user_id,
        req.user!.tenant_id,
        targetUserIds.map(Number),
        content.trim(),
      );
      res.json({ status: "success", data });
    } catch (err) { next(err); }
  },
};
