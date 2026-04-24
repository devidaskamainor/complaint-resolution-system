# 🔐 Authentication System Implementation Guide

## Overview
I've created a complete authentication system for both Citizen and Officer portals. Users must now register and login before they can file or manage complaints.

## ✅ What's Been Created

### 1. **Backend API (Already Running)**
- JWT-based authentication
- User registration and login
- Password encryption with bcrypt
- Role-based access control

### 2. **Citizen Portal with Authentication**
Created new files:
- `citizen-new.html` - Citizen portal with login/register modals
- `citizen-script-new.js` - Script with backend API integration

### 3. **API Client**
- `api-client.js` - Handles all backend communication
- Automatic JWT token management
- Easy-to-use methods for all API endpoints

## 📋 How It Works

### For Citizens:

1. **First Time Users:**
   - Visit Citizen Portal
   - Click "Register" button
   - Fill in: Name, Email, Phone, Password
   - Account is created automatically
   - Logged in automatically after registration

2. **Returning Users:**
   - Visit Citizen Portal
   - Click "Login" button
   - Enter Email and Password
   - Access granted to file/track complaints

3. **Features After Login:**
   - File new complaints
   - View all my complaints
   - Track complaint status
   - View complaint details and timeline
   - Logout when done

### For Officers:

Officers need the same login system. The officer.html needs to be updated with:
- Login modal
- Register modal (for creating officer accounts)
- Authentication check
- Backend API integration

## 🚀 How to Test

### Step 1: Make Sure Backend is Running
```bash
node server.js
```
Server should be running on http://localhost:3000

### Step 2: Test Citizen Registration
1. Open http://localhost:3000/citizen-new.html
2. Click "Register" button
3. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 1234567890
   - Password: password123
   - Confirm Password: password123
4. Click "Register"
5. You should be logged in automatically!

### Step 3: Test Login
1. Logout (click Logout in navbar)
2. Click "Login" button
3. Enter:
   - Email: john@example.com
   - Password: password123
4. Click "Login"
5. You're back in!

### Step 4: File a Complaint
1. Scroll to "File New Complaint"
2. Fill in complaint details
3. Click "Submit Complaint"
4. Complaint is saved to backend!

### Step 5: View Complaints
1. Scroll to "My Complaints"
2. See all your complaints
3. Click "View" to see details

## 📁 Files Created/Modified

### New Files:
- `citizen-new.html` - Citizen portal with auth
- `citizen-script-new.js` - Citizen script with API
- `api-client.js` - API client library
- `AUTH-GUIDE.md` - This guide

### Backend Files (Already Created):
- `server.js` - Express server
- `database.js` - JSON database
- `routes/auth.js` - Auth endpoints
- `routes/complaints.js` - Complaint endpoints
- `routes/users.js` - User endpoints
- `middleware/auth.js` - JWT middleware
- `package.json` - Dependencies
- `database.json` - Auto-created database

### Need to Update:
- `officer.html` - Add login/register (similar to citizen)
- `officer-script.js` - Integrate with backend API

## 🔧 Next Steps to Complete

### 1. Replace Old Citizen Files
```bash
# Backup old files
cp citizen.html citizen-old.html.backup
cp citizen-script.js citizen-script-old.js.backup

# Replace with new authenticated versions
cp citizen-new.html citizen.html
cp citizen-script-new.js citizen-script.js
```

### 2. Update Officer Portal
Create `officer-new.html` and `officer-script-new.js` with:
- Login/Register modals
- Authentication check
- Backend API integration
- Role verification (must be 'officer')

### 3. Test Complete Flow
1. Register citizen account
2. File complaint as citizen
3. Register officer account
4. Login as officer
5. View/manage all complaints
6. Update complaint status
7. Logout and login again

## 🎯 API Endpoints Used

### Citizen Portal:
- `POST /api/auth/register` - Register new citizen
- `POST /api/auth/login` - Login citizen
- `GET /api/auth/me` - Get current user
- `POST /api/complaints/create` - Create complaint
- `GET /api/complaints/my-complaints` - Get my complaints
- `GET /api/complaints/:id` - Get complaint by ID

### Officer Portal (to be implemented):
- `POST /api/auth/register` - Register new officer
- `POST /api/auth/login` - Login officer
- `GET /api/complaints/all` - Get all complaints
- `PUT /api/complaints/:id/status` - Update status
- `PUT /api/complaints/:id/escalate` - Escalate complaint
- `GET /api/complaints/statistics` - Get stats

## 🔐 Security Features

1. **Password Encryption**: All passwords hashed with bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **Role Verification**: Citizens can only access citizen portal
4. **Protected Routes**: Backend validates all API calls
5. **Token Expiry**: Tokens expire after 7 days
6. **Email Verification**: Check if user exists before registration

## 💡 Important Notes

1. **Database**: Stored in `database.json` (auto-created)
2. **Port**: Backend runs on port 3000
3. **Frontend**: Any port (currently 3000 with backend serving static files)
4. **Token Storage**: JWT tokens stored in localStorage
5. **Session**: Persists until user logs out or token expires

## 🐛 Troubleshooting

### "Login failed" error:
- Check if backend server is running
- Verify email and password are correct
- Check browser console for errors

### "No token provided" error:
- User is not logged in
- Token may have expired
- Login again

### Complaint not showing:
- Check if complaint was created successfully
- Verify it belongs to logged-in user
- Check browser console for API errors

### Server won't start:
- Make sure Node.js is installed
- Run `npm install` first
- Check if port 3000 is available

## 📞 Support

If you need help:
1. Check browser console (F12)
2. Check server terminal output
3. Verify backend is running
4. Test API endpoints with Postman

---

**Status**: Citizen portal authentication is COMPLETE! 
**Next**: Officer portal needs the same authentication system.
