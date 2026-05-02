import { Router } from "express";
import { requireAuth, requireRoles } from "../../shared/middleware/auth.middleware";
import {
  createBloodRequest,
  getMyBloodRequests,
  getVisibleBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  respondToBloodRequest,
  cancelBloodRequest,
  getPriorityBloodRequests,
  getAcceptedBloodRequests,
} from "../controllers/blood-request.controller";

const bloodRequestRouter = Router();

// Create a blood request (individual or hospital)
bloodRequestRouter.post(
  "/blood-requests",
  requireAuth,
  requireRoles("HOSPITAL", "USER"),
  createBloodRequest
);

// Get my blood requests (as requester)
bloodRequestRouter.get(
  "/blood-requests/my",
  requireAuth,
  getMyBloodRequests
);

// Get visible blood requests (as potential responder)
bloodRequestRouter.get(
  "/blood-requests/visible",
  requireAuth,
  getVisibleBloodRequests
);

// Get priority-ranked blood requests
bloodRequestRouter.get(
  "/blood-requests/priority",
  requireAuth,
  getPriorityBloodRequests
);

// Get requests accepted by current user
bloodRequestRouter.get(
  "/blood-requests/accepted",
  requireAuth,
  getAcceptedBloodRequests
);

// Get a single blood request
bloodRequestRouter.get(
  "/blood-requests/:requestId",
  requireAuth,
  getBloodRequestById
);

// Update a blood request (only by requester)
bloodRequestRouter.patch(
  "/blood-requests/:requestId",
  requireAuth,
  updateBloodRequest
);

// Respond to a blood request (by donor or hospital)
bloodRequestRouter.post(
  "/blood-requests/:requestId/respond",
  requireAuth,
  respondToBloodRequest
);

// Cancel a blood request
bloodRequestRouter.post(
  "/blood-requests/:requestId/cancel",
  requireAuth,
  cancelBloodRequest
);

export { bloodRequestRouter };
