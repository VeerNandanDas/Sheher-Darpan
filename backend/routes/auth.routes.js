import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { firebaseAuth } from "../middlewares/auth.js";
import { body, validationResult } from "express-validator";

const router = Router();

// Public routes
router.post("/register", [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], authController.register);

router.get("/check-user/:firebaseUid", authController.checkUser);

// Protected routes (require Firebase authentication)
router.use(firebaseAuth);

router.get("/profile", authController.getProfile);
router.put("/profile", [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], authController.updateProfile);
router.get("/stats", authController.getUserStats);
router.delete("/account", authController.deleteAccount);

export default router;