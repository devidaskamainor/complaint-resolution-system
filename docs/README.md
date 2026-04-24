# 🚀 Complaint Resolution System - Full Stack Application

A professional, full-stack web application for managing citizen complaints with a modern UI/UX and robust backend API.

## 📋 Features

### Frontend
- ✅ Modern, responsive design with gradients and animations
- ✅ Citizen Portal - File complaints with photos and voice messages
- ✅ Officer Portal - Manage, approve, and escalate complaints
- ✅ Real-time complaint tracking
- ✅ Professional dashboard with statistics

### Backend
- ✅ RESTful API with Express.js
- ✅ JWT-based authentication
- ✅ Role-based access control (Citizen/Officer)
- ✅ JSON file-based database (easy to setup)
- ✅ Complete CRUD operations for complaints
- ✅ Escalation management system
- ✅ Statistics and analytics API
- ✅ Search and filter functionality

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This will install all required packages:
- express - Web framework
- cors - Cross-origin resource sharing
- body-parser - Request body parsing
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- multer - File upload handling
- express-validator - Input validation
- morgan - HTTP request logging
- nodemon - Auto-restart during development

### Step 2: Start the Backend Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on: **http://localhost:3000**

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile

### Complaints
- `POST /api/complaints/create` - Create new complaint
- `GET /api/complaints/all` - Get all complaints (Officer only)
- `GET /api/complaints/my-complaints` - Get my complaints (Citizen)
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id/status` - Update complaint status (Officer)
- `PUT /api/complaints/:id/escalate` - Escalate complaint (Officer)
- `GET /api/complaints/:id/escalations` - Get escalation history
- `GET /api/complaints/statistics` - Get statistics (Officer)
- `GET /api/complaints/search` - Search complaints (Officer)
- `DELETE /api/complaints/:id` - Delete complaint (Officer)

### Users
- `GET /api/users/all` - Get all users (Officer only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Officer)

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **citizen** - Can create and view own complaints
- **officer** - Can manage all complaints and users

## 💾 Database

The application uses a JSON file-based database (`database.json`) that is automatically created when the server starts. No external database setup required!

### Database Structure:
- `users` - User accounts
- `complaints` - All complaints
- `escalations` - Escalation history
- `metadata` - System metadata

## 🌐 Frontend Integration

The frontend automatically connects to the backend API through `api-client.js`. Just make sure the backend server is running on port 3000.

### Using the Application:

1. **Start the backend server** (npm start)
2. **Open your browser** to http://localhost:3000
3. **Register/Login** to use the citizen or officer portal
4. **File complaints** as a citizen
5. **Manage complaints** as an officer

## 📁 Project Structure

```
CRS/
├── server.js              # Main server file
├── database.js            # Database operations
├── api-client.js          # Frontend API client
├── package.json           # Dependencies
├── index.html             # Home page
├── citizen.html           # Citizen portal
├── officer.html           # Officer portal
├── style.css              # Main styles
├── portal-styles.css      # Portal-specific styles
├── home-script.js         # Home page JS
├── citizen-script.js      # Citizen portal JS
├── officer-script.js      # Officer portal JS
├── routes/                # API routes
│   ├── auth.js            # Authentication routes
│   ├── complaints.js      # Complaint routes
│   └── users.js           # User routes
├── middleware/             # Express middleware
│   └── auth.js            # Auth middleware
└── database.json           # Auto-created database file
```

## 🔧 Development

### Environment Variables (Optional)
Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
```

### API Testing

You can test the API using tools like Postman, Insomnia, or curl:

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "citizen",
    "phone": "1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🚀 Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Consider using MongoDB or PostgreSQL instead of JSON file
4. Enable HTTPS
5. Set up proper logging and monitoring

## 📝 License

ISC

## 👨‍💻 Author

Professional Complaint Resolution System

---

**Need Help?** Check the API documentation or contact support.
