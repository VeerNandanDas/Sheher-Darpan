import Report from "../models/Report.js";
import User from "../models/User.js";
import { classifyReport } from "../utils/fakeAI.js";

const reportController = {
  createReport: async (req, res) => {
    try {
      const { title, description, latitude, longitude, address } = req.body;
      const userId = req.user.id;
      const imagePath = req.file ? req.file.filename : null;

      const category = classifyReport(title, description);

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
          duplicate: duplicates[0]
        });
      }

      const report = await Report.create({
        user: userId,
        title,
        description,
        image_path: imagePath,
        latitude,
        longitude,
        address,
        category
      });

      await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });

      req.app.get("io").emit("new-report", {
        id: report._id,
        title,
        category,
        latitude,
        longitude
      });

      res.status(201).json({ success: true, report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAllReports: async (req, res) => {
    try {
      const reports = await Report.find().populate("user", "name").sort({ createdAt: -1 }).lean();
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getReport: async (req, res) => {
    try {
      const report = await Report.findById(req.params.id).populate("user", "name").lean();
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json({ report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        { status, resolved_at: status === "resolved" ? new Date() : null },
        { new: true }
      );

      if (!updatedReport) return res.status(404).json({ error: "Report not found" });

      if (status === "resolved") {
        await User.findByIdAndUpdate(updatedReport.user, { $inc: { points: 5 } });
      }

      req.app.get("io").emit("report-updated", { id: updatedReport._id, status });

      res.json({ success: true, updatedReport });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserReports: async (req, res) => {
    try {
      const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default reportController;
