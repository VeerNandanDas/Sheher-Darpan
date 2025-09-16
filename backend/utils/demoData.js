import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Report from '../models/report.model.js';
import Badge from '../models/badge.model.js';
import { initDb } from './db.js';

const createDemoData = async () => {
  try {
    console.log('🎭 Creating demo data...');

    // Create demo users
    const demoUsers = [
      {
        firebaseUid: 'demo-user-1',
        email: 'priya.sharma@example.com',
        name: 'Priya Sharma',
        phone: '+91-9876543210',
        points: 25,
        isAdmin: false
      },
      {
        firebaseUid: 'demo-user-2', 
        email: 'raj.patel@example.com',
        name: 'Raj Patel',
        phone: '+91-9876543211',
        points: 15,
        isAdmin: false
      },
      {
        firebaseUid: 'demo-user-3',
        email: 'sneha.singh@example.com', 
        name: 'Sneha Singh',
        phone: '+91-9876543212',
        points: 10,
        isAdmin: false
      },
      {
        firebaseUid: 'demo-admin-1',
        email: 'admin@shehrdarpan.com',
        name: 'Admin User',
        phone: '+91-9876543299',
        points: 0,
        isAdmin: true
      }
    ];

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Badge.deleteMany({});

    // Create users
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} demo users`);

    // Create demo reports
    const demoReports = [
      {
        user: createdUsers[0]._id,
        title: 'Huge pothole on MG Road',
        description: 'Dangerous pothole causing vehicle damage near City Mall. Multiple vehicles have been damaged.',
        image_path: 'demo-pothole-1.jpg',
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'MG Road, Connaught Place, New Delhi',
        category: 'pothole',
        status: 'resolved',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
      },
      {
        user: createdUsers[1]._id,
        title: 'Broken streetlight near school',
        description: 'Dark area creating safety concerns for children walking to school in the morning.',
        image_path: 'demo-streetlight-1.jpg',
        latitude: 28.6129,
        longitude: 77.2095,
        address: 'Janpath Road, New Delhi',
        category: 'streetlight',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        user: createdUsers[2]._id,
        title: 'Overflowing garbage bin',
        description: 'Unhygienic conditions due to overflowing municipal bin. Foul smell affecting nearby residents.',
        image_path: 'demo-garbage-1.jpg',
        latitude: 28.6149,
        longitude: 77.2085,
        address: 'Kasturba Gandhi Marg, New Delhi',
        category: 'garbage',
        status: 'in-progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        user: createdUsers[0]._id,
        title: 'Water leak on main road',
        description: 'Continuous water wastage from broken municipal pipe. Water flowing on the road.',
        image_path: 'demo-water-1.jpg',
        latitude: 28.6159,
        longitude: 77.2080,
        address: 'Parliament Street, New Delhi',
        category: 'water',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        user: createdUsers[1]._id,
        title: 'Damaged traffic signal',
        description: 'Traffic signal not working properly at busy intersection. Causing traffic jams.',
        image_path: 'demo-traffic-1.jpg',
        latitude: 28.6169,
        longitude: 77.2075,
        address: 'India Gate Circle, New Delhi',
        category: 'traffic',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        user: createdUsers[2]._id,
        title: 'Broken pavement tiles',
        description: 'Several pavement tiles are broken and creating tripping hazard for pedestrians.',
        image_path: 'demo-infrastructure-1.jpg',
        latitude: 28.6179,
        longitude: 77.2070,
        address: 'Rajpath, New Delhi',
        category: 'infrastructure',
        status: 'pending',
        priority: 'low',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ];

    const createdReports = await Report.insertMany(demoReports);
    console.log(`✅ Created ${createdReports.length} demo reports`);

    // Create demo badges
    const demoBadges = [
      {
        user: createdUsers[0]._id,
        badgeType: 'first_report',
        badgeName: 'First Report',
        description: 'Submitted your first report',
        icon: '🎯',
        points: 5,
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        user: createdUsers[0]._id,
        badgeType: 'problem_solver',
        badgeName: 'Problem Solver',
        description: 'Submitted 5 reports',
        icon: '🔧',
        points: 25,
        earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        user: createdUsers[1]._id,
        badgeType: 'first_report',
        badgeName: 'First Report',
        description: 'Submitted your first report',
        icon: '🎯',
        points: 5,
        earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        user: createdUsers[2]._id,
        badgeType: 'first_report',
        badgeName: 'First Report',
        description: 'Submitted your first report',
        icon: '🎯',
        points: 5,
        earnedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    const createdBadges = await Badge.insertMany(demoBadges);
    console.log(`✅ Created ${createdBadges.length} demo badges`);

    // Update user badges
    await User.findByIdAndUpdate(createdUsers[0]._id, { 
      badges: [createdBadges[0]._id, createdBadges[1]._id] 
    });
    await User.findByIdAndUpdate(createdUsers[1]._id, { 
      badges: [createdBadges[2]._id] 
    });
    await User.findByIdAndUpdate(createdUsers[2]._id, { 
      badges: [createdBadges[3]._id] 
    });

    console.log('🎉 Demo data created successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`📋 Reports: ${createdReports.length}`);
    console.log(`🏆 Badges: ${createdBadges.length}`);
    console.log('\n🔑 Demo User Credentials:');
    console.log('Regular Users:');
    console.log('- priya.sharma@example.com (25 points, 2 badges)');
    console.log('- raj.patel@example.com (15 points, 1 badge)');
    console.log('- sneha.singh@example.com (10 points, 1 badge)');
    console.log('\nAdmin User:');
    console.log('- admin@shehrdarpan.com (Admin privileges)');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runDemo = async () => {
    try {
      await initDb();
      await createDemoData();
      console.log('\n✅ Demo setup completed! You can now start the server.');
      process.exit(0);
    } catch (error) {
      console.error('Demo setup failed:', error);
      process.exit(1);
    }
  };
  
  runDemo();
}

export { createDemoData };
