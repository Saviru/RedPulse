import { Router } from "express";

import { feedbackController } from "../controllers/feedbackController";
import { upload } from "../app";

export const feedbackRoutes = Router();

feedbackRoutes.get("/feedback", feedbackController.getAll);
feedbackRoutes.post("/feedback", upload.array("attachments", 10), feedbackController.create);
feedbackRoutes.put("/feedback/:id", feedbackController.update);
feedbackRoutes.put("/feedback/:id/complaint", feedbackController.updateComplaint);
feedbackRoutes.delete("/feedback/:id", feedbackController.remove);

feedbackRoutes.post("/feedback/:id/replies", feedbackController.addReply);
feedbackRoutes.put("/feedback/:id/replies/:replyId", feedbackController.updateReply);
feedbackRoutes.delete("/feedback/:id/replies/:replyId", feedbackController.deleteReply);

feedbackRoutes.get("/analytics", feedbackController.analytics);

