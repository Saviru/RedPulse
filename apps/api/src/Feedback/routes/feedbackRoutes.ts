import { Router } from "express";

import { feedbackController } from "../controllers/feedbackController";
import { createUploadMiddleware } from "../shared/middleware/upload.middleware";

export const feedbackRoutes = Router();
const uploadFeedback = createUploadMiddleware("feedback-images");

// Feedback CRUD
feedbackRoutes.get("/feedback", feedbackController.getAll);
feedbackRoutes.post(
  "/feedback",
  uploadFeedback.array("attachments", 10),
  feedbackController.create,
);
feedbackRoutes.put("/feedback/:id", feedbackController.update);
feedbackRoutes.delete("/feedback/:id", feedbackController.remove);

// Complaint-specific status/priority/assignment update
feedbackRoutes.put("/feedback/:id/complaint", feedbackController.updateComplaint);

// Replies
feedbackRoutes.post("/feedback/:id/replies", feedbackController.addReply);
feedbackRoutes.put("/feedback/:id/replies/:replyId", feedbackController.updateReply);
feedbackRoutes.delete(
  "/feedback/:id/replies/:replyId",
  feedbackController.deleteReply,
);

// Aggregate analytics
feedbackRoutes.get("/analytics", feedbackController.analytics);
