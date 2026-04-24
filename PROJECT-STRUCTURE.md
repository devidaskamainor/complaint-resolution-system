# Complaint Resolution System - Project Structure

## 📁 Directory Structure

```
CRS/
├── backend/                    # Backend server code
│   ├── config/                 # Configuration files
│   │   └── database.js         # MongoDB connection config
│   ├── middleware/             # Express middleware
│   │   └── auth.js             # Authentication middleware
│   ├── models/                 # Database models
│   │   ├── Complaint.js        # Complaint model
│   │   ├── Escalation.js       # Escalation model
│   │   └── User.js             # User model
│   ├── routes/                 # API routes
│   │   ├── auth.js             # Auth routes (JSON DB)
│   │   ├── auth-mongodb.js     # Auth routes (MongoDB)
│   │   ├── complaints.js       # Complaint routes (JSON DB)
│   │   ├── complaints-mongodb.js # Complaint routes (MongoDB)
│   │   ├── users.js            # User routes (JSON DB)
│   │   └── users-mongodb.js    # User routes (MongoDB)
│   ├── utils/                  # Utility functions
│   ├── database.js             # JSON database handler
│   ├── database-mongodb.js     # MongoDB database handler
│   ├── database.json           # JSON database file
│   ├── server.js               # Main server (JSON DB)
│   ├── server-mongodb.js       # MongoDB server
│   └── server-production.js    # Production server
├── frontend/                   # Frontend code
│   ├── css/                    # Stylesheets
│   │   ├── style.css           # Main styles
│   │   └── portal-styles.css   # Portal-specific styles
│   ├── js/                     # JavaScript files
│   │   ├── api-client.js       # API client helper
│   │   ├── citizen-script.js   # Citizen portal logic
│   │   ├── home-script.js      # Home page logic
│   │   └── officer-script.js   # Officer portal logic
│   └── pages/                  # HTML pages
│       ├── index.html          # Home page
│       ├── citizen.html        # Citizen portal
│       └── officer.html        # Officer portal
├── docs/                       # Documentation
│   ├── AUTH-GUIDE.md
│   ├── CAPACITY-ANALYSIS.md
│   ├── MONGODB-ATLAS-SETUP-STEPS.md
│   ├── MONGODB-SETUP.md
│   ├── MONGODB-UPGRADE-COMPLETE.md
│   ├── PRODUCTION-UPGRADE.md
│   └── README.md
├── .env                        # Environment variables
├── .env.example                # Environment variables template
├── package.json                # Node.js dependencies
└── package-lock.json           # Dependency lock file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Edit .env file with your settings
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Running the Application

**Development Mode (JSON Database):**
```bash
npm start
```

**Development Mode (MongoDB):**
```bash
npm run start:mongodb
```

**Production Mode:**
```bash
npm run start:production
```

**With Hot Reload (Nodemon):**
```bash
npm run dev
# or
npm run dev:mongodb
```

## 🌐 Access Points

- **Home Page**: http://localhost:3000
- **Citizen Portal**: http://localhost:3000/citizen
- **Officer Portal**: http://localhost:3000/officer
- **API Base**: http://localhost:3000/api

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile

### Users
- `GET /api/users/all` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Complaints
- `POST /api/complaints/create` - Create complaint
- `GET /api/complaints/all` - Get all complaints
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint

## 🔧 Project Sections

### Backend
- **Server**: Express.js application with multiple server configurations
- **Routes**: RESTful API endpoints for authentication, users, and complaints
- **Models**: Mongoose schemas for MongoDB collections
- **Middleware**: Authentication, validation, and error handling
- **Config**: Database connection and environment setup

### Frontend
- **Pages**: HTML templates for home, citizen, and officer portals
- **CSS**: Responsive styling with Bootstrap and custom styles
- **JavaScript**: Client-side logic and API integration

### Database
- **MongoDB**: Primary database (recommended for production)
- **JSON File**: Fallback database for development/testing

## 📝 Notes

- The project supports both MongoDB and JSON file storage
- MongoDB is recommended for production use (handles 1 lakh+ users)
- All API routes have both MongoDB and JSON versions
- Environment variables are stored in `.env` file
- Documentation is available in the `docs/` folder
