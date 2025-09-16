import User from '../models/user.model.js';
import Badge from '../models/badge.model.js';
import Report from '../models/report.model.js';

const userController = {
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

  // Get leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const { limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('name points badgeCount createdAt')
        .sort({ points: -1, createdAt: 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const totalUsers = await User.countDocuments();
      const currentUserRank = await User.countDocuments({ points: { $gt: req.user.points } }) + 1;

      // Add rank to each user
      const leaderboard = users.map((user, index) => ({
        ...user,
        rank: skip + index + 1,
        id: user._id
      }));

      res.json({
        success: true,
        leaderboard,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit: parseInt(limit)
        },
        currentUserRank
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch leaderboard',
        message: error.message
      });
    }
  },

  // Get user badges
  getUserBadges: async (req, res) => {
    try {
      const badges = await Badge.find({ user: req.user.id })
        .sort({ earnedAt: -1 })
        .lean();

      // Get badge statistics
      const totalBadgePoints = badges.reduce((sum, badge) => sum + (badge.points || 0), 0);
      const uniqueBadgeTypes = [...new Set(badges.map(badge => badge.badgeType))];

      res.json({
        success: true,
        badges: badges.map(badge => ({
          id: badge._id,
          badgeType: badge.badgeType,
          badgeName: badge.badgeName,
          description: badge.description,
          icon: badge.icon,
          points: badge.points,
          earnedAt: badge.earnedAt,
          metadata: badge.metadata
        })),
        stats: {
          totalBadges: badges.length,
          totalBadgePoints,
          uniqueBadgeTypes: uniqueBadgeTypes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch badges',
        message: error.message
      });
    }
  },

  // Get user's reports
  getUserReports: async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const filter = { user: req.user.id };
      if (status) filter.status = status;
      if (category) filter.category = category;

      const reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const totalReports = await Report.countDocuments(filter);

      res.json({
        success: true,
        reports: reports.map(report => ({
          id: report._id,
          title: report.title,
          description: report.description,
          image_path: report.image_path,
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.address,
          category: report.category,
          status: report.status,
          priority: report.priority,
          createdAt: report.createdAt,
          resolved_at: report.resolved_at
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReports / limit),
          totalReports,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch user reports',
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

      // Get reports statistics
      const reportsStats = await Report.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            inProgressReports: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            },
            resolvedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        }
      ]);

      const stats = reportsStats[0] || {
        totalReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        resolvedReports: 0
      };

      // Get category breakdown
      const categoryStats = await Report.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Calculate total badge points
      const totalBadgePoints = user.badges.reduce((sum, badge) => sum + (badge.points || 0), 0);

      // Calculate resolution rate
      const resolutionRate = stats.totalReports > 0 
        ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        stats: {
          user: {
            name: user.name,
            email: user.email,
            points: user.points,
            totalBadges: user.badges.length,
            totalBadgePoints,
            memberSince: user.createdAt,
            lastActive: user.lastActive
          },
          reports: {
            total: stats.totalReports,
            pending: stats.pendingReports,
            inProgress: stats.inProgressReports,
            resolved: stats.resolvedReports,
            resolutionRate: parseFloat(resolutionRate)
          },
          categories: categoryStats.map(cat => ({
            category: cat._id,
            count: cat.count
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch user statistics',
        message: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
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
  },

  // Get user activity feed
  getActivityFeed: async (req, res) => {
    try {
      const { limit = 20 } = req.query;

      // Get recent reports
      const recentReports = await Report.find({ user: req.user.id })
        .select('title status category createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      // Get recent badges
      const recentBadges = await Badge.find({ user: req.user.id })
        .select('badgeType badgeName icon points earnedAt')
        .sort({ earnedAt: -1 })
        .limit(5)
        .lean();

      // Combine and sort activities
      const activities = [
        ...recentReports.map(report => ({
          type: 'report',
          id: report._id,
          title: report.title,
          status: report.status,
          category: report.category,
          timestamp: report.createdAt,
          description: `Reported ${report.category} issue`
        })),
        ...recentBadges.map(badge => ({
          type: 'badge',
          id: badge._id,
          title: badge.badgeName,
          icon: badge.icon,
          points: badge.points,
          timestamp: badge.earnedAt,
          description: `Earned ${badge.badgeName} badge`
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        activities: activities.slice(0, parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch activity feed',
        message: error.message
      });
    }
  }
};

export default userController;
