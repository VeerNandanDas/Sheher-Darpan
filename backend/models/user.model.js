import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    badges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Badge"
    }],
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// Index for leaderboard queries
userSchema.index({ points: -1, createdAt: 1 });

// Virtual for total badges count
userSchema.virtual('badgeCount').get(function() {
    return this.badges.length;
});

// Method to add points
userSchema.methods.addPoints = function(points) {
    this.points += points;
    return this.save();
};

// Method to check if user has specific badge
userSchema.methods.hasBadge = function(badgeType) {
    return this.badges.some(badge => badge.badgeType === badgeType);
};

export default mongoose.model("User", userSchema);