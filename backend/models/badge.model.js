import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    badgeType: {
        type: String,
        required: true,
        enum: [
            'first_report',
            'problem_solver',
            'civic_champion',
            'early_bird',
            'consistency_king',
            'community_hero',
            'quick_reporter',
            'detail_oriented',
            'persistent_citizen',
            'city_improver'
        ]
    },
    badgeName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '🏆'
    },
    points: {
        type: Number,
        default: 0
    },
    earnedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { 
    timestamps: true 
});

// Index for user badges queries
badgeSchema.index({ user: 1, badgeType: 1 });
badgeSchema.index({ user: 1, earnedAt: -1 });

// Static method to create badge
badgeSchema.statics.createBadge = function(userId, badgeType, metadata = {}) {
    const badgeConfigs = {
        first_report: {
            badgeName: 'First Report',
            description: 'Submitted your first report',
            icon: '🎯',
            points: 5
        },
        problem_solver: {
            badgeName: 'Problem Solver',
            description: 'Submitted 5 reports',
            icon: '🔧',
            points: 25
        },
        civic_champion: {
            badgeName: 'Civic Champion',
            description: 'Submitted 25 reports',
            icon: '🏆',
            points: 100
        },
        early_bird: {
            badgeName: 'Early Bird',
            description: 'Submitted report within 1 hour of issue',
            icon: '🐦',
            points: 15
        },
        consistency_king: {
            badgeName: 'Consistency King',
            description: 'Submitted reports for 7 consecutive days',
            icon: '👑',
            points: 50
        },
        community_hero: {
            badgeName: 'Community Hero',
            description: 'Helped resolve 10 community issues',
            icon: '🦸',
            points: 75
        },
        quick_reporter: {
            badgeName: 'Quick Reporter',
            description: 'Submitted 3 reports in one day',
            icon: '⚡',
            points: 20
        },
        detail_oriented: {
            badgeName: 'Detail Oriented',
            description: 'Submitted report with detailed description and image',
            icon: '🔍',
            points: 10
        },
        persistent_citizen: {
            badgeName: 'Persistent Citizen',
            description: 'Followed up on 5 pending reports',
            icon: '💪',
            points: 30
        },
        city_improver: {
            badgeName: 'City Improver',
            description: 'Had 5 reports resolved',
            icon: '🏙️',
            points: 40
        }
    };

    const config = badgeConfigs[badgeType];
    if (!config) {
        throw new Error(`Invalid badge type: ${badgeType}`);
    }

    return this.create({
        user: userId,
        badgeType,
        ...config,
        metadata
    });
};

export default mongoose.model("Badge", badgeSchema);
