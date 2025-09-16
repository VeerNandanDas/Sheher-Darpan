# 🚀 Shehr Darpan Backend Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Firebase project
- Git

---

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb

# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `MONGO_URI` in `.env` file

### 3. Firebase Setup

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `shehr-darpan`
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" and "Google" providers
5. Save changes

#### Step 3: Generate Service Account Key
1. Go to "Project Settings" (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the following values:
   - `project_id`
   - `private_key`
   - `client_email`

#### Step 4: Configure Environment Variables
Create `.env` file in backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/sheherdarpan
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sheherdarpan

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 4. Create Uploads Directory

```bash
# Create uploads directory for file storage
mkdir uploads
```

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# OR production mode
npm start
```

### 6. Setup Demo Data (Optional)

```bash
# Create demo data for testing
npm run demo-setup
```

---

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/sheherdarpan` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `shehr-darpan-12345` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` |

### MongoDB Collections

The following collections will be created automatically:

- **users** - User profiles and authentication data
- **reports** - Citizen reports and issues
- **badges** - User achievements and badges

---

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. API Documentation
Visit: `http://localhost:5000/api`

### 3. Test with Postman
1. Import the Postman collection from `POSTMAN_COLLECTION.md`
2. Set up environment variables
3. Run the test collection

---

## 🔐 Authentication Flow

### Frontend Integration

1. **Install Firebase SDK in your frontend:**
```bash
npm install firebase
```

2. **Initialize Firebase in your frontend:**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

3. **Get Firebase ID Token:**
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const user = await signInWithEmailAndPassword(auth, email, password);
const token = await user.user.getIdToken();

// Use token in API calls
fetch('http://localhost:5000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📱 Frontend Integration

### Socket.io Client Setup

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join user room for notifications
socket.emit('join-user-room', userId);

// Join admin room for admin notifications
socket.emit('join-admin-room');

// Listen for new reports
socket.on('new-report', (data) => {
  console.log('New report:', data);
});

// Listen for report updates
socket.on('report-updated', (data) => {
  console.log('Report updated:', data);
});
```

### API Client Setup

```javascript
class ShehrDarpanAPI {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Auth methods
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  // Report methods
  async createReport(reportData) {
    const formData = new FormData();
    Object.keys(reportData).forEach(key => {
      formData.append(key, reportData[key]);
    });

    return fetch(`${this.baseURL}/api/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    }).then(res => res.json());
  }

  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/reports?${queryString}`);
  }
}

// Usage
const api = new ShehrDarpanAPI();
api.setToken(firebaseToken);
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running
- Check MongoDB connection string
- Verify MongoDB port (default: 27017)

#### 2. Firebase Authentication Failed
```
Error: Firebase Admin SDK initialization failed
```
**Solution:**
- Check Firebase credentials in `.env`
- Ensure private key is properly formatted with `\n`
- Verify project ID and client email

#### 3. File Upload Issues
```
Error: ENOENT: no such file or directory, open 'uploads/...'
```
**Solution:**
- Create `uploads` directory: `mkdir uploads`
- Check file permissions
- Verify multer configuration

#### 4. CORS Issues
```
Error: Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution:**
- Check `FRONTEND_URL` in `.env`
- Verify CORS configuration in `app.js`

#### 5. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
- Change port in `.env`: `PORT=5001`
- Kill existing process: `lsof -ti:5000 | xargs kill -9`

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Logs

Check server logs for detailed error information:
```bash
# View logs in real-time
tail -f logs/app.log

# Or check console output
npm run dev
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

1. **Health Check Endpoint:**
   - URL: `http://localhost:5000/health`
   - Returns server status and uptime

2. **Database Health:**
   - Check MongoDB connection
   - Monitor collection sizes
   - Verify indexes

3. **Performance Monitoring:**
   - Monitor response times
   - Check memory usage
   - Track error rates

### Backup Strategy

1. **Database Backup:**
```bash
# MongoDB backup
mongodump --db sheherdarpan --out backup/

# Restore backup
mongorestore --db sheherdarpan backup/sheherdarpan/
```

2. **File Backup:**
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/
```

---

## 🚀 Deployment

### Production Environment

1. **Environment Variables:**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sheherdarpan
FIREBASE_PROJECT_ID=your-production-project
# ... other production values
```

2. **Security Considerations:**
   - Use HTTPS in production
   - Set up proper CORS origins
   - Implement rate limiting
   - Use environment-specific Firebase projects

3. **Performance Optimization:**
   - Enable MongoDB indexes
   - Implement caching
   - Use CDN for file uploads
   - Monitor and optimize queries

---

## ✅ Verification Checklist

- [ ] MongoDB is running and accessible
- [ ] Firebase project is configured
- [ ] Environment variables are set
- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] Demo data is created successfully
- [ ] API endpoints respond correctly
- [ ] File upload works
- [ ] Socket.io connections work
- [ ] Authentication flow works

---

## 🎉 You're Ready!

Your Shehr Darpan backend is now fully configured and ready for development. Start building your frontend and integrate with these APIs!

For any issues, check the troubleshooting section or refer to the Postman collection for testing.
