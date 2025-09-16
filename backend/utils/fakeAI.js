// Fake AI classification for hackathon demo
export const classifyReport = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  
  const categories = {
    'pothole': ['pothole', 'road', 'crack', 'street', 'hole', 'asphalt', 'pavement', 'bumpy'],
    'streetlight': ['light', 'lamp', 'dark', 'bulb', 'street light', 'illumination', 'power', 'electricity'],
    'garbage': ['trash', 'waste', 'garbage', 'litter', 'bin', 'dump', 'rubbish', 'refuse', 'cleanup'],
    'water': ['water', 'leak', 'pipe', 'drain', 'sewage', 'flood', 'overflow', 'blockage', 'drainage'],
    'traffic': ['traffic', 'signal', 'sign', 'zebra crossing', 'road sign', 'stop sign', 'traffic light', 'junction'],
    'safety': ['safety', 'danger', 'hazard', 'unsafe', 'accident', 'risk', 'emergency', 'urgent'],
    'infrastructure': ['bridge', 'building', 'wall', 'fence', 'barrier', 'construction', 'damage', 'broken'],
    'environment': ['tree', 'park', 'garden', 'pollution', 'air', 'noise', 'green', 'nature'],
    'other': []
  };
  
  // Calculate score for each category
  const scores = {};
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = keywords.reduce((score, keyword) => {
      return score + (text.includes(keyword) ? 1 : 0);
    }, 0);
  }
  
  // Find category with highest score
  const bestCategory = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  return scores[bestCategory] > 0 ? bestCategory : 'other';
};

// Priority assignment based on category and keywords
export const assignPriority = (title, description, category) => {
  const text = (title + ' ' + description).toLowerCase();
  
  // High priority keywords
  const highPriorityKeywords = [
    'urgent', 'emergency', 'danger', 'hazard', 'accident', 'injured', 'hurt',
    'blocking', 'blocked', 'traffic', 'school', 'hospital', 'fire', 'gas leak'
  ];
  
  // Check for high priority keywords
  const hasHighPriority = highPriorityKeywords.some(keyword => text.includes(keyword));
  
  if (hasHighPriority) return 'high';
  
  // Category-based priority
  const categoryPriority = {
    'safety': 'high',
    'traffic': 'high',
    'water': 'medium',
    'streetlight': 'medium',
    'pothole': 'medium',
    'garbage': 'low',
    'environment': 'low',
    'infrastructure': 'medium',
    'other': 'low'
  };
  
  return categoryPriority[category] || 'low';
};

// Duplicate detection
export const checkDuplicates = (reports, newReport) => {
  return reports.filter(report => {
    // Calculate distance (simple approximation)
    const latDiff = Math.abs(report.latitude - newReport.latitude);
    const lonDiff = Math.abs(report.longitude - newReport.longitude);
    const distance = latDiff + lonDiff; // Simple distance calculation
    
    // Check time difference
    const timeDiff = Date.now() - new Date(report.createdAt).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Check if same category
    const sameCategory = report.category === newReport.category;
    
    // Consider duplicate if:
    // - Within 100m radius (0.001 degrees ≈ 100m)
    // - Within 24 hours
    // - Same category
    return distance < 0.001 && hoursDiff < 24 && sameCategory;
  });
};

// Generate fake AI response for demo
export const generateAIResponse = (title, description, category) => {
  const responses = {
    'pothole': [
      'Pothole detected! This appears to be a road maintenance issue.',
      'Road surface damage identified. Priority assigned based on location.',
      'Pothole classification confirmed. Estimated repair time: 2-3 days.'
    ],
    'streetlight': [
      'Street lighting issue detected. Electrical maintenance required.',
      'Lighting malfunction identified. Safety concern for pedestrians.',
      'Street light out of order. Night visibility compromised.'
    ],
    'garbage': [
      'Waste management issue identified. Sanitation department notified.',
      'Garbage accumulation detected. Cleanup crew dispatched.',
      'Litter problem confirmed. Environmental health concern.'
    ],
    'water': [
      'Water infrastructure issue detected. Utility department alerted.',
      'Water leak identified. Resource wastage concern.',
      'Drainage problem confirmed. Flood risk assessment needed.'
    ],
    'traffic': [
      'Traffic infrastructure issue detected. Traffic management notified.',
      'Road safety concern identified. Traffic control required.',
      'Traffic signal malfunction confirmed. Safety priority assigned.'
    ],
    'safety': [
      'Safety hazard detected! Immediate attention required.',
      'High-risk situation identified. Emergency response needed.',
      'Safety concern confirmed. Priority escalation initiated.'
    ]
  };
  
  const categoryResponses = responses[category] || responses['other'] || [
    'Issue classified and logged. Appropriate department notified.',
    'Report processed successfully. Action plan initiated.',
    'Community concern acknowledged. Resolution in progress.'
  ];
  
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
};

// Simulate AI processing delay
export const simulateAIProcessing = async (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
