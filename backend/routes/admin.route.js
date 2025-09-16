import { Router } from "express";
import adminController from "../controllers/admin.controller.js";
import { firebaseAuth, adminOnly } from "../middlewares/auth.js";

const router = Router();

// All admin routes require authentication and admin privileges
router.use(firebaseAuth);
router.use(adminOnly);

// Dashboard and analytics
router.get("/dashboard", adminController.getDashboardStats);
router.get("/analytics", adminController.getAnalytics);

// Report management
router.get("/reports", adminController.getAllReportsAdmin);
router.patch("/reports/:id/status", adminController.updateReportStatus);

// User management
router.get("/users", adminController.getUsers);
router.patch("/users/:userId/admin", adminController.toggleAdminStatus);

export default router;