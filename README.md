# 🏛️ Complaint Resolution System (CRS)

A professional, production-ready Complaint Registration and Management System built with Node.js, Express, and MongoDB.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

## 🌟 Features

- ✅ **Citizen Portal** - File complaints with images/videos
- ✅ **Officer Portal** - Manage and resolve complaints
- ✅ **OTP Verification** - Secure officer registration
- ✅ **Password Reset** - Email-based password recovery
- ✅ **Auto-Escalation** - Automatic complaint escalation after 72 hours
- ✅ **AI Content Detection** - Detect AI-generated images/voice
- ✅ **Multimedia Support** - Upload images, videos, and audio
- ✅ **Responsive Design** - Works on all devices
- ✅ **Dark/Light Mode** - Theme toggle support

## 🚀 Live Demo

**Deployed on Render:** [Your Live URL Here](https://your-app.onrender.com)

## 📸 Screenshots

Add your screenshots here!

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Email:** Nodemailer
- **Security:** Helmet, bcryptjs, rate limiting

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Steps

1. **Clone the repository:**
```bash
git clone https://github.com/devidaskamainor/complaint-resolution-system.git
cd complaint-resolution-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crs
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. **Start the server:**
```bash
# Development
npm run dev:mongodb

# Production
npm start
```

5. **Access the application:**
- Home: http://localhost:3000
- Citizen Portal: http://localhost:3000/citizen
- Officer Portal: http://localhost:3000/officer

## 🌐 Deployment

### Deploy to Render (Recommended)

1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy!

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions.

## 📁 Project Structure

```
complaint-resolution-system/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/       # Auth, upload, email services
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server-mongodb.js # Main server file
├── frontend/
│   ├── pages/           # HTML pages
│   ├── css/             # Stylesheets
│   └── js/              # Client-side scripts
├── uploads/             # File uploads
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md            # This file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/all` - Get all complaints
- `GET /api/complaints/:id` - Get single complaint
- `PUT /api/complaints/:id` - Update complaint

### OTP
- `POST /api/otp/generate` - Generate OTP
- `POST /api/otp/verify` - Verify OTP

### Password Reset
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

## 🔒 Security Features

- JWT authentication
- Password hashing (bcryptjs)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- File type validation

## 📊 Database

Uses MongoDB with the following collections:
- `users` - User accounts
- `complaints` - Complaint records
- `escalations` - Escalation history

## 🎯 User Roles

### Citizen
- Register and login
- File complaints with media
- Track complaint status
- View complaint timeline

### Officer
- OTP verification required
- View assigned complaints
- Update complaint status
- Add remarks and notes

## 📧 Email Configuration

For OTP and password reset features:

1. Enable 2-Step Verification in Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add credentials to `.env`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Devidas Kamainor**
- GitHub: [@devidaskamainor](https://github.com/devidaskamainor)

## 🙏 Acknowledgments

- MongoDB Atlas for cloud database
- Render for hosting
- Express.js community

---

**⭐ Star this repository if you found it helpful!**
