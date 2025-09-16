import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { firebaseAuth, optionalAuth } from "../middlewares/auth.js";

const router = Router();

// Public routes (no auth required)
router.get("/leaderboard", optionalAuth, userController.getLeaderboard);

// Protected routes (require Firebase authentication)
router.use(firebaseAuth);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.get("/badges", userController.getUserBadges);
router.get("/reports", userController.getUserReports);
router.get("/stats", userController.getUserStats);
router.get("/activity", userController.getActivityFeed);

export default router;