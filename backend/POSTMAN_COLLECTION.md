# Shehr Darpan API - Postman Collection

## 🚀 Setup Instructions

### 1. Environment Variables
Create a new environment in Postman with these variables:

```
BASE_URL: http://localhost:5000
FIREBASE_TOKEN: {{your_firebase_id_token}}
USER_ID: {{user_id_from_response}}
REPORT_ID: {{report_id_from_response}}
```

### 2. Firebase Authentication Setup
1. Get Firebase ID token from your frontend app
2. Set the `FIREBASE_TOKEN` environment variable
3. Use `{{FIREBASE_TOKEN}}` in Authorization header

---

## 📚 API Endpoints Collection

### 🔐 Authentication Routes (`/api/auth`)

#### 1. Register User
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "firebaseUid": "firebase_uid_here",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91-9876543210"
}
```

#### 2. Check User Exists
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/auth/check-user/{{firebase_uid}}`

#### 3. Get User Profile
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/auth/profile`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 4. Update Profile
- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/auth/profile`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Updated Name",
  "phone": "+91-9876543211"
}
```

#### 5. Get User Stats
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/auth/stats`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 6. Delete Account
- **Method:** `DELETE`
- **URL:** `{{BASE_URL}}/api/auth/account`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

---

### 👤 User Routes (`/api/users`)

#### 1. Get User Profile
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/profile`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 2. Update Profile
- **Method:** `PUT`
- **URL:** `{{BASE_URL}}/api/users/profile`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Updated Name",
  "phone": "+91-9876543211"
}
```

#### 3. Get Leaderboard
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/leaderboard?limit=10&page=1`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}` (optional)

#### 4. Get User Badges
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/badges`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 5. Get User Reports
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/reports?status=pending&category=pothole&page=1&limit=10`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 6. Get User Stats
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/stats`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 7. Get Activity Feed
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/users/activity?limit=20`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

---

### 📋 Report Routes (`/api/reports`)

#### 1. Create Report
- **Method:** `POST`
- **URL:** `{{BASE_URL}}/api/reports`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: multipart/form-data`
- **Body (form-data):**
  - `title`: "Pothole on Main Road"
  - `description`: "Large pothole causing vehicle damage"
  - `latitude`: 28.6139
  - `longitude`: 77.2090
  - `address`: "MG Road, New Delhi"
  - `image`: [Select file]

#### 2. Get All Reports
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/reports?status=pending&category=pothole&priority=high&page=1&limit=20&sortBy=createdAt&sortOrder=desc`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}` (optional)

#### 3. Get Single Report
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/reports/{{REPORT_ID}}`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}` (optional)

#### 4. Update Report Status
- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/reports/{{REPORT_ID}}/status`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "status": "in-progress"
}
```

#### 5. Get User Reports
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/reports/my-reports?status=pending&category=pothole&page=1&limit=10`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 6. Search Reports
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/reports/search?q=pothole&category=pothole&status=pending&page=1&limit=20`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}` (optional)

#### 7. Get Reports by Category
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/reports/category/pothole?page=1&limit=20`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}` (optional)

---

### 👨‍💼 Admin Routes (`/api/admin`)

#### 1. Get Dashboard Stats
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/admin/dashboard`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 2. Get Analytics
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/admin/analytics?period=30d`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 3. Get All Reports (Admin)
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/admin/reports?status=pending&category=pothole&priority=high&page=1&limit=20&sortBy=createdAt&sortOrder=desc`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 4. Update Report Status (Admin)
- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/admin/reports/{{REPORT_ID}}/status`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "status": "resolved",
  "adminNotes": "Issue resolved by maintenance team"
}
```

#### 5. Get Users
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api/admin/users?search=john&page=1&limit=20&sortBy=points&sortOrder=desc`
- **Headers:** `Authorization: Bearer {{FIREBASE_TOKEN}}`

#### 6. Toggle Admin Status
- **Method:** `PATCH`
- **URL:** `{{BASE_URL}}/api/admin/users/{{USER_ID}}/admin`
- **Headers:** 
  - `Authorization: Bearer {{FIREBASE_TOKEN}}`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "isAdmin": true
}
```

---

### 🔍 Utility Endpoints

#### 1. Health Check
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/health`

#### 2. API Documentation
- **Method:** `GET`
- **URL:** `{{BASE_URL}}/api`

---

## 🧪 Testing Workflow

### 1. Setup Demo Data
```bash
cd backend
npm run demo-setup
```

### 2. Test Authentication Flow
1. Register a new user
2. Get user profile
3. Update profile
4. Get user stats

### 3. Test Report Flow
1. Create a new report (with image)
2. Get all reports
3. Get specific report
4. Update report status
5. Search reports

### 4. Test Admin Flow
1. Make a user admin
2. Get dashboard stats
3. Get all reports as admin
4. Update report status as admin
5. Get analytics

### 5. Test User Features
1. Get leaderboard
2. Get user badges
3. Get user reports
4. Get activity feed

---

## 📝 Response Examples

### Successful Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [ ... ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "limit": 20
  }
}
```

---

## 🔧 Common Issues & Solutions

### 1. Firebase Token Issues
- **Problem:** 401 Unauthorized
- **Solution:** Ensure Firebase token is valid and not expired

### 2. File Upload Issues
- **Problem:** 400 Bad Request on file upload
- **Solution:** Check file size (max 5MB) and file type (images only)

### 3. Admin Access Issues
- **Problem:** 403 Forbidden on admin routes
- **Solution:** Ensure user has admin privileges

### 4. Duplicate Report Issues
- **Problem:** 400 Duplicate report found
- **Solution:** Check if similar report exists within 100m radius and 24 hours

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎯 Quick Test Script

```javascript
// Postman Pre-request Script for setting variables
pm.environment.set("BASE_URL", "http://localhost:5000");

// Postman Test Script for extracting IDs
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    if (response.user && response.user.id) {
        pm.environment.set("USER_ID", response.user.id);
    }
    if (response.report && response.report.id) {
        pm.environment.set("REPORT_ID", response.report.id);
    }
}
```

---

## 🚀 Ready to Test!

Your Shehr Darpan backend is now complete with:
- ✅ Complete MongoDB/Mongoose implementation
- ✅ Firebase Authentication
- ✅ File upload handling
- ✅ Real-time Socket.io notifications
- ✅ Comprehensive API endpoints
- ✅ Error handling and validation
- ✅ Demo data for testing

Start testing with the health check endpoint first, then proceed with the authentication flow!
