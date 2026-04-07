import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.config";
import { requestLogger } from "./utils/logger";
import router from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(requestLogger);

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));
app.use("/api/v1", router);
app.use(errorMiddleware);

export { app };
