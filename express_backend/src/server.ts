import { app } from "./app";
import { env } from "./config/env.config";
import { prisma } from "./models/prisma.client";
import { logger } from "./utils/logger";
import { cleanupStaleSessions, cleanupExpiredSlots } from "./features/sessions/session.service";

const server = app.listen(env.PORT, async () => {
  logger.info(`🚀  EthioTutor API → http://localhost:${env.PORT}`);
  logger.info(`📦  ENV: ${env.NODE_ENV}`);

  // On startup: clean up any stale sessions and expired slots left over
  // from server restarts, tutor browser crashes, etc.
  try {
    await cleanupStaleSessions();
    await cleanupExpiredSlots();
    logger.info("✅  Startup cleanup complete.");
  } catch (err) {
    logger.error("Startup cleanup failed (non-fatal):", err);
  }
});

async function shutdown(signal: string) {
  logger.info(`${signal} — shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (r) => { logger.error("UnhandledRejection:", r); shutdown("UnhandledRejection"); });

export { server };
