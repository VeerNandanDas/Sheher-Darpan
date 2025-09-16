import User from '../models/user.model.js';
import Report from '../models/report.model.js';
import Badge from '../models/badge.model.js';

const adminController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Get basic counts
      const [
        totalUsers,
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedReports,
        totalBadges
      ] = await Promise.all([
        User.countDocuments(),
        Report.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'in-progress' }),
        Report.countDocuments({ status: 'resolved' }),
        Badge.countDocuments()
      ]);

      // Get reports by category
      const reportsByCategory = await Report.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get reports by status
      const reportsByStatus = await Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get reports by priority
      const reportsByPriority = await Report.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get recent reports (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentReports = await Report.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Get top contributors
      const topContributors = await User.find()
        .select('name points badgeCount')
        .sort({ points: -1 })
        .limit(5)
        .lean();

      // Calculate resolution rate
      const resolutionRate = totalReports > 0 
        ? ((resolvedReports / totalReports) * 100).toFixed(1)
        : 0;

      // Get monthly report trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrends = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.json({
        success: true,
        stats: {
          overview: {
            totalUsers,
            totalReports,
            pendingReports,
            inProgressReports,
            resolvedReports,
            totalBadges,
            resolutionRate: parseFloat(resolutionRate),
            recentReports
          },
          reportsByCategory: reportsByCategory.map(cat => ({
            category: cat._id,
            total: cat.count,
            resolved: cat.resolved,
            resolutionRate: cat.count > 0 ? ((cat.resolved / cat.count) * 100).toFixed(1) : 0
          })),
          reportsByStatus: reportsByStatus.map(status => ({
            status: status._id,
            count: status.count
          })),
          reportsByPriority: reportsByPriority.map(priority => ({
            priority: priority._id,
            count: priority.count
          })),
          topContributors: topContributors.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            points: user.points,
            badges: user.badgeCount
          })),
          monthlyTrends: monthlyTrends.map(trend => ({
            month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
            total: trend.count,
            resolved: trend.resolved
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch dashboard statistics',
        message: error.message
      });
    }
  },

  // Get all reports with filters
  getAllReportsAdmin: async (req, res) => {
    try {
      const { 
        status, 
        category, 
        priority, 
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const reports = await Report.find(filter)
        .populate('user', 'name email points')
        .sort(sort)
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
          resolved_at: report.resolved_at,
          user: {
            id: report.user._id,
            name: report.user.name,
            email: report.user.email,
            points: report.user.points
          }
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
        error: 'Failed to fetch reports',
        message: error.message
      });
    }
  },

  // Update report status
  updateReportStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!['pending', 'in-progress', 'resolved'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status. Must be pending, in-progress, or resolved',
          code: 'INVALID_STATUS'
        });
      }

      const updateData = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date();
      } else {
        updateData.resolved_at = null;
      }

      const report = await Report.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('user', 'name email points');

      if (!report) {
        return res.status(404).json({
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
      }

      // Award bonus points for resolution
      if (status === 'resolved') {
        await User.findByIdAndUpdate(report.user._id, { 
          $inc: { points: 5 } 
        });
      }

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('report-updated', { 
          id: report._id, 
          status,
          adminNotes 
        });
      }

      res.json({
        success: true,
        message: 'Report status updated successfully',
        report: {
          id: report._id,
          status: report.status,
          resolved_at: report.resolved_at
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update report status',
        message: error.message
      });
    }
  },

  // Get user management data
  getUsers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, sortBy = 'points', sortOrder = 'desc' } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const users = await User.find(filter)
        .select('name email points badgeCount isAdmin createdAt lastActive')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const totalUsers = await User.countDocuments(filter);

      // Get user report counts
      const userIds = users.map(user => user._id);
      const reportCounts = await Report.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            totalReports: { $sum: 1 },
            resolvedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        }
      ]);

      const reportCountMap = {};
      reportCounts.forEach(rc => {
        reportCountMap[rc._id.toString()] = {
          total: rc.totalReports,
          resolved: rc.resolvedReports
        };
      });

      const usersWithStats = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        badgeCount: user.badgeCount,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        reports: reportCountMap[user._id.toString()] || { total: 0, resolved: 0 }
      }));

      res.json({
        success: true,
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  },

  // Toggle user admin status
  toggleAdminStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isAdmin },
        { new: true }
      ).select('name email isAdmin');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: `User ${isAdmin ? 'promoted to' : 'removed from'} admin`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update admin status',
        message: error.message
      });
    }
  },

  // Get analytics data
  getAnalytics: async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let startDate;
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get daily report trends
      const dailyTrends = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // Get category performance
      const categoryPerformance = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'resolved'] },
                  {
                    $divide: [
                      { $subtract: ['$resolved_at', '$createdAt'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  },
                  null
                ]
              }
            }
          }
        },
        { $sort: { total: -1 } }
      ]);

      res.json({
        success: true,
        analytics: {
          period,
          dailyTrends: dailyTrends.map(trend => ({
            date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
            total: trend.total,
            resolved: trend.resolved
          })),
          categoryPerformance: categoryPerformance.map(cat => ({
            category: cat._id,
            total: cat.total,
            resolved: cat.resolved,
            resolutionRate: cat.total > 0 ? ((cat.resolved / cat.total) * 100).toFixed(1) : 0,
            avgResolutionTime: cat.avgResolutionTime ? cat.avgResolutionTime.toFixed(1) : null
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  }
};

export default adminController;
