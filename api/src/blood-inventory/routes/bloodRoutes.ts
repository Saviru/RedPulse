import { Router } from "express";
import {
  createBlood,
  deleteBlood,
  getAlerts,
  getAllBlood,
  getAllBloodRecords,
  getBloodById,
  getDashboard,
  getHospitalUsernames,
  getNextUnitId,
  updateBlood,
} from "../controllers/bloodController";
import { asyncHandler } from "../utils/asyncHandler";

import { createUploadMiddleware } from "../../shared/middleware/upload.middleware";

const router = Router();
const uploadPacket = createUploadMiddleware("blood-packets");

router.post("/", uploadPacket.single("packetImage"), asyncHandler(createBlood));
router.get("/hospital-usernames", asyncHandler(getHospitalUsernames));
router.get("/next-unit-id", asyncHandler(getNextUnitId));
router.get("/alerts", asyncHandler(getAlerts));
router.get("/dashboard", asyncHandler(getDashboard));
router.get("/all", asyncHandler(getAllBloodRecords));
router.get("/", asyncHandler(getAllBlood));
/** POST delete: works everywhere (some clients block or mishandle DELETE). */
router.post("/:id/delete", asyncHandler(deleteBlood));
router.get("/:id", asyncHandler(getBloodById));
router.put("/:id", asyncHandler(updateBlood));
router.delete("/:id", asyncHandler(deleteBlood));

export default router;
