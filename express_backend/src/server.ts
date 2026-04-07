import { app } from "./app";
import { env } from "./config/env.config";
import { prisma } from "./models/prisma.client";
import { logger } from "./utils/logger";


const server = app.listen(env.PORT, () => {
  logger.info(`🚀  EthioTutor API → http://localhost:${env.PORT}`);
  logger.info(`📦  ENV: ${env.NODE_ENV}`);
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
