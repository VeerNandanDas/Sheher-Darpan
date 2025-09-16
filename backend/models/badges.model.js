import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badge_type: { type: String, required: true },
  badge_name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Badge", badgeSchema);
