import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image_path: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  category: { type: String, default: "other" },
  status: { type: String, enum: ["pending", "in-progress", "resolved"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  resolved_at: { type: Date }
}, { timestamps: true });

// Geo index for duplicate detection
reportSchema.index({ latitude: 1, longitude: 1, category: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
