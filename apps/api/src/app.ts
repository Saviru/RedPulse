import cors from "cors";
import express from "express";
import morgan from "morgan";

import { campaignRouter } from "./campaigns/routes/campaignRoutes";
import { organizationRouter } from "./organizations/routes/organizationRoutes";
import { errorHandler, notFoundHandler } from "./shared/middleware/errorHandler.middleware";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API healthy" });
});

app.use("/api/campaigns", campaignRouter);
app.use("/api/organizations", organizationRouter);

app.use(notFoundHandler);
app.use(errorHandler);
