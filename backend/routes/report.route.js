import { Router } from "express";
import reportController from "../controllers/report.controller.js";
import { firebaseAuth, optionalAuth } from "../middlewares/auth.js";
import { uploadSingle, handleUploadError } from "../middlewares/upload.js";

const router = Router();

// Public routes (no auth required)
router.get("/", optionalAuth, reportController.getAllReports);
router.get("/search", optionalAuth, reportController.searchReports);
router.get("/category/:category", optionalAuth, reportController.getReportsByCategory);
router.get("/:id", optionalAuth, reportController.getReport);

// Protected routes (require Firebase authentication)
router.use(firebaseAuth);

router.post("/", uploadSingle, handleUploadError, reportController.createReport);
router.get("/my-reports", reportController.getUserReports);
router.patch("/:id/status", reportController.updateStatus);

export default router;