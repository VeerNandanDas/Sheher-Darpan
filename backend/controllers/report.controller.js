import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import Badge from "../models/badge.model.js";
import { classifyReport, assignPriority, generateAIResponse, simulateAIProcessing } from "../utils/fakeAI.js";

const reportController = {
  createReport: async (req, res) => {
    try {
      const { title, description, latitude, longitude, address } = req.body;
      const userId = req.user.id;
      const imagePath = req.file ? req.file.filename : null;

      // Validate required fields
      if (!title || !description || !latitude || !longitude) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['title', 'description', 'latitude', 'longitude']
        });
      }

      // AI Classification
      const category = classifyReport(title, description);
      const priority = assignPriority(title, description, category);

      // Duplicate detection (within 24 hrs & ~100m radius)
      const duplicates = await Report.find({
        category,
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
        longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 }
      }).lean();

      if (duplicates.length > 0) {
        return res.status(400).json({
          error: "Duplicate report found",
          duplicate: duplicates[0],
          code: 'DUPLICATE_REPORT'
        });
      }

      // Create report
      const report = await Report.create({
        user: userId,
        title,
        description,
        image_path: imagePath,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        category,
        priority
      });

      // Award points to user
      await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });

      // Check for badge eligibility
      try {
        const user = await User.findById(userId);
        const userReports = await Report.countDocuments({ user: userId });
        
        // Award badges based on report count
        if (userReports === 1 && !user.hasBadge('first_report')) {
          await Badge.createBadge(userId, 'first_report');
        } else if (userReports === 5 && !user.hasBadge('problem_solver')) {
          await Badge.createBadge(userId, 'problem_solver');
        } else if (userReports === 25 && !user.hasBadge('civic_champion')) {
          await Badge.createBadge(userId, 'civic_champion');
        }

        // Check for quick reporter badge (3 reports in one day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReports = await Report.countDocuments({
          user: userId,
          createdAt: { $gte: today }
        });
        
        if (todayReports === 3 && !user.hasBadge('quick_reporter')) {
          await Badge.createBadge(userId, 'quick_reporter');
        }
      } catch (badgeError) {
        console.log('Badge creation failed:', badgeError.message);
      }

      // Generate AI response
      const aiResponse = generateAIResponse(title, description, category);

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.emit('new-report', {
          id: report._id,
          title,
          category,
          priority,
          latitude,
          longitude,
          aiResponse
        });
      }

      res.status(201).json({ 
        success: true, 
        report: {
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
          createdAt: report.createdAt
        },
        aiResponse,
        message: 'Report created successfully'
      });
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ 
        error: 'Failed to create report',
        message: error.message 
      });
    }
  },

  getAllReports: async (req, res) => {
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

  getReport: async (req, res) => {
    try {
      const report = await Report.findById(req.params.id)
        .populate('user', 'name email points')
        .lean();

      if (!report) {
        return res.status(404).json({ 
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        report: {
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
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch report',
        message: error.message 
      });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;

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

      const updatedReport = await Report.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('user', 'name email points');

      if (!updatedReport) {
        return res.status(404).json({ 
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
      }

      // Award bonus points for resolution
      if (status === 'resolved') {
        await User.findByIdAndUpdate(updatedReport.user._id, { 
          $inc: { points: 5 } 
        });

        // Check for city improver badge
        try {
          const user = await User.findById(updatedReport.user._id);
          const resolvedCount = await Report.countDocuments({ 
            user: updatedReport.user._id, 
            status: 'resolved' 
          });
          
          if (resolvedCount === 5 && !user.hasBadge('city_improver')) {
            await Badge.createBadge(updatedReport.user._id, 'city_improver');
          }
        } catch (badgeError) {
          console.log('Badge creation failed:', badgeError.message);
        }
      }

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('report-updated', { 
          id: updatedReport._id, 
          status,
          user: updatedReport.user
        });
      }

      res.json({
        success: true,
        message: 'Report status updated successfully',
        report: {
          id: updatedReport._id,
          status: updatedReport.status,
          resolved_at: updatedReport.resolved_at
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to update report status',
        message: error.message 
      });
    }
  },

  getUserReports: async (req, res) => {
    try {
      const { 
        status, 
        category, 
        page = 1, 
        limit = 10 
      } = req.query;

      const filter = { user: req.user.id };
      if (status) filter.status = status;
      if (category) filter.category = category;

      const skip = (page - 1) * limit;

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

  // Get reports by category
  getReportsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const reports = await Report.find({ category })
        .populate('user', 'name email points')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const totalReports = await Report.countDocuments({ category });

      res.json({
        success: true,
        category,
        reports: reports.map(report => ({
          id: report._id,
          title: report.title,
          description: report.description,
          image_path: report.image_path,
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.address,
          status: report.status,
          priority: report.priority,
          createdAt: report.createdAt,
          user: {
            id: report.user._id,
            name: report.user.name,
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
        error: 'Failed to fetch reports by category',
        message: error.message 
      });
    }
  },

  // Search reports
  searchReports: async (req, res) => {
    try {
      const { q, category, status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { address: { $regex: q, $options: 'i' } }
        ];
      }
      if (category) filter.category = category;
      if (status) filter.status = status;

      const reports = await Report.find(filter)
        .populate('user', 'name email points')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const totalReports = await Report.countDocuments(filter);

      res.json({
        success: true,
        query: q,
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
          user: {
            id: report.user._id,
            name: report.user.name,
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
        error: 'Failed to search reports',
        message: error.message 
      });
    }
  }
};

export default reportController;
