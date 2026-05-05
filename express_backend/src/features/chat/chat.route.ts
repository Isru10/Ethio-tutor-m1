import { Router } from "express";
import { chatController } from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/conversations",               chatController.getConversations);
router.post("/conversations",              chatController.startConversation);
router.get("/conversations/:id/messages",  chatController.getMessages);
router.post("/conversations/:id/messages", chatController.sendMessage);
router.patch("/conversations/:id/read",    chatController.markRead);
router.get("/users",                       chatController.getChatableUsers);
router.get("/unread",                      chatController.getUnreadCounts);

// Admin-only: broadcast a message to multiple users at once
router.post("/broadcast", requireRole("ADMIN", "SUPER_ADMIN", "MODERATOR"), chatController.broadcast);

export default router;
