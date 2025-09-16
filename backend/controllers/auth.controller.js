import User from '../models/user.model.js';
import Badge from '../models/badge.model.js';
import { body, validationResult } from 'express-validator';

const authController = {
  // Register new user (Firebase UID based)
  register: async (req, res) => {
    try {
      const { firebaseUid, email, name, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { firebaseUid },
          { email: email.toLowerCase() }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create new user
      const user = await User.create({
        firebaseUid,
        email: email.toLowerCase(),
        name,
        phone,
        points: 0
      });

      // Award first report badge
      try {
        await Badge.createBadge(user._id, 'first_report');
      } catch (badgeError) {
        console.log('Badge creation failed:', badgeError.message);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          points: user.points,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate('badges', 'badgeType badgeName description icon points earnedAt')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          points: user.points,
          badgeCount: user.badges.length,
          badges: user.badges,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          lastActive: user.lastActive
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: error.message
      });
    }
  },

  // Update user profile
  updateProfile: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
          });
        }

        const { name, phone } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(
          req.user.id,
          updateData,
          { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        res.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            points: user.points,
            isAdmin: user.isAdmin
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to update profile',
          message: error.message
        });
      }
    }
  ],

  // Check if user exists (for frontend)
  checkUser: async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      
      const user = await User.findOne({ firebaseUid })
        .select('_id email name phone points isAdmin createdAt');

      if (!user) {
        return res.status(404).json({
          exists: false,
          message: 'User not found'
        });
      }

      res.json({
        exists: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          points: user.points,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check user',
        message: error.message
      });
    }
  },

  // Delete user account
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Delete associated badges
      await Badge.deleteMany({ user: req.user.id });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete account',
        message: error.message
      });
    }
  },

  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate('badges', 'badgeType badgeName points earnedAt');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user's reports count
      const Report = (await import('../models/report.model.js')).default;
      const reportsCount = await Report.countDocuments({ user: req.user.id });
      const resolvedReportsCount = await Report.countDocuments({ 
        user: req.user.id, 
        status: 'resolved' 
      });

      // Calculate total badge points
      const totalBadgePoints = user.badges.reduce((sum, badge) => sum + (badge.points || 0), 0);

      res.json({
        success: true,
        stats: {
          totalPoints: user.points,
          totalBadges: user.badges.length,
          totalBadgePoints,
          reportsSubmitted: reportsCount,
          reportsResolved: resolvedReportsCount,
          resolutionRate: reportsCount > 0 ? (resolvedReportsCount / reportsCount * 100).toFixed(1) : 0,
          memberSince: user.createdAt,
          lastActive: user.lastActive
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch user stats',
        message: error.message
      });
    }
  }
};

export default authController;
