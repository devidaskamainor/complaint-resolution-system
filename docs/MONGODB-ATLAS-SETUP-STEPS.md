# 🚀 MongoDB Atlas Setup - Step by Step Guide

## Quick Overview
MongoDB Atlas is a **FREE cloud database** service. No installation required!

---

## 📋 Step 1: Create MongoDB Atlas Account

1. **Go to**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up** using:
   - Google account (easiest)
   - GitHub account
   - Email address
3. **Complete registration** (takes 1 minute)

---

## 📋 Step 2: Create Your First Cluster

1. After login, click **"Build a Database"** button
2. Choose **FREE Tier (M0)**
   - ✅ 512 MB storage
   - ✅ Shared RAM
   - ✅ Perfect for 1 lakh users
   - ✅ Completely FREE
3. **Select Cloud Provider**: Choose "AWS" or "GCP"
4. **Select Region**: Choose closest to your location
   - India: `Mumbai (ap-south-1)`
   - US: `N. Virginia (us-east-1)`
   - Europe: `Frankfurt (eu-central-1)`
5. Click **"Create Cluster"** (takes 2-3 minutes)

---

## 📋 Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"+ ADD NEW DATABASE USER"**
3. Choose **"Password"** authentication method
4. **Set Username**: (e.g., `crsadmin`)
5. **Set Password**: Click "Autogenerate Secure Password" and **COPY IT**
6. **Database User Privileges**: Keep as "Read and write to any database"
7. Click **"Add User"**

⚠️ **IMPORTANT**: Save the username and password! You'll need it.

---

## 📋 Step 4: Whitelist Your IP Address

1. In the left sidebar, click **"Network Access"**
2. Click **"+ ADD IP ADDRESS"**
3. Choose one of these options:
   
   **Option A: Allow All (For Development)**
   - Click **"ALLOW ACCESS FROM ANYWHERE"**
   - This adds `0.0.0.0/0`
   - ✅ Easiest for testing
   - ⚠️ Only for development
   
   **Option B: Allow Your IP (More Secure)**
   - Click **"ADD CURRENT IP ADDRESS"**
   - ✅ More secure
   - ⚠️ Need to update if IP changes

4. Click **"Confirm"**

---

## 📋 Step 5: Get Your Connection String

1. In the left sidebar, click **"Database"**
2. Find your cluster and click **"Connect"** button
3. Select **"Connect your application"**
4. Choose:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. **Copy the connection string** (looks like this):

```
mongodb+srv://crsadmin:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

6. **Replace `<password>`** with the password you saved in Step 3

**Example** (if password is `MyPass123`):
```
mongodb+srv://crsadmin:MyPass123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

7. **Add database name** at the end:
```
mongodb+srv://crsadmin:MyPass123@cluster0.abc123.mongodb.net/complaint-resolution-system?retryWrites=true&w=majority
```

---

## 📋 Step 6: Update Your Project

1. **Open** the `.env` file in your project:
   ```
   c:\Users\Devidas\Downloads\CRS\.env
   ```

2. **Find this line**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/complaint-resolution-system
   ```

3. **Replace it** with your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://crsadmin:MyPass123@cluster0.abc123.mongodb.net/complaint-resolution-system?retryWrites=true&w=majority
   ```

4. **Save the file**

---

## 📋 Step 7: Start Your Server

```bash
npm run start:mongodb
```

**You should see:**
```
╔═══════════════════════════════════════════════╗
║   🗄️  MongoDB Connected Successfully!        ║
║   📊 Host: cluster0.abc123.mongodb.net
║   📁 Database: complaint-resolution-system
║   🔗 Connection Pool: 100 connections
╚═══════════════════════════════════════════════╝

╔═══════════════════════════════════════════════╗
║   🚀 Complaint Resolution System Server      ║
║   📡 Running on: http://localhost:3000       ║
║   📊 API Base: http://localhost:3000/api     ║
║   🌐 Frontend: http://localhost:3000         ║
║   💾 Database: MongoDB
╚═══════════════════════════════════════════════╝
```

---

## ✅ Verification Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created FREE cluster (M0 tier)
- [ ] Created database user with password
- [ ] Whitelisted IP address (0.0.0.0/0 for dev)
- [ ] Copied connection string
- [ ] Replaced `<password>` in connection string
- [ ] Updated `.env` file with connection string
- [ ] Started server with `npm run start:mongodb`
- [ ] Saw "MongoDB Connected Successfully!" message

---

## 🎯 Testing Your Connection

### **Test 1: Register a User**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "citizen"
  }'
```

### **Test 2: Create a Complaint**
```bash
curl -X POST http://localhost:3000/api/complaints/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "title": "Test Complaint",
    "description": "This is a test complaint",
    "location": "Test Location",
    "category": "Water Supply",
    "priority": "high"
  }'
```

### **Test 3: View in MongoDB Atlas**
1. Go to MongoDB Atlas dashboard
2. Click **"Database"**
3. Click **"Browse Collections"**
4. You should see:
   - `users` collection
   - `complaints` collection
   - `escalations` collection

---

## ⚠️ Common Issues & Solutions

### **Issue 1: Authentication Failed**
```
MongoServerError: Authentication failed
```
**Solution:**
- Check username and password in connection string
- Make sure you replaced `<password>` with actual password
- Password is case-sensitive

### **Issue 2: IP Not Whitelisted**
```
MongoServerError: IP not whitelisted
```
**Solution:**
- Go to Network Access in Atlas
- Add your IP address or allow all (0.0.0.0/0)

### **Issue 3: Network Timeout**
```
MongoServerSelectionError: Connection timeout
```
**Solution:**
- Check your internet connection
- Verify cluster is not paused (Atlas auto-pauses after 7 days of inactivity)
- Try different region if needed

### **Issue 4: Database Name Missing**
```
Connected but data not saving
```
**Solution:**
- Make sure database name is in connection string:
  ```
  mongodb+srv://.../complaint-resolution-system?...
  ```

---

## 💡 Pro Tips

### **1. Keep Your Cluster Active**
MongoDB Atlas FREE tier auto-pauses after 7 days of inactivity.
- **Solution**: Log in to Atlas dashboard once a week and click "Resume"

### **2. Monitor Your Usage**
- Go to Atlas dashboard → Metrics
- Watch storage usage (limit: 512 MB)
- 1 lakh users with complaints = ~200-300 MB

### **3. Backup Your Data**
- Atlas has automatic backups (7 days on FREE tier)
- Manual backup: Click "Collections" → "Export"

### **4. Connection String Security**
- Never commit `.env` file to GitHub
- `.env` is already in `.gitignore`
- Use environment variables in production

---

## 📊 MongoDB Atlas FREE Tier Limits

| Resource | Limit | Your Usage |
|----------|-------|------------|
| Storage | 512 MB | ~200-300 MB (1 lakh users) |
| RAM | Shared | Sufficient |
| vCPUs | Shared | Sufficient |
| Connections | 500 | You use 100 |
| Backup | 7 days | Automatic |

✅ **Verdict**: FREE tier is perfect for 1 lakh users!

---

## 🎓 Next Steps After Setup

1. **Test your application** at http://localhost:3000
2. **Register users** and create complaints
3. **Monitor performance** in Atlas dashboard
4. **Scale up** if needed (upgrade to M10 for $57/month)

---

## 🆘 Need Help?

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **MongoDB University** (FREE courses): https://university.mongodb.com/
- **Support**: https://www.mongodb.com/cloud/atlas/support

---

## 🎉 You're Done!

Once you see "MongoDB Connected Successfully!", your system is ready to handle **1 lakh users** with:

✅ Cloud database (no installation)
✅ Automatic backups
✅ High availability
✅ Fast global access
✅ Production-ready

**Your Complaint Resolution System is now production-ready!** 🚀
