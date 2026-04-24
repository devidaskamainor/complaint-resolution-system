# 🚀 HOSTING GUIDE - Complaint Resolution System

## ✅ Pre-Deployment Checklist

### 🔴 CRITICAL (Must Do Before Hosting)

1. **Change JWT_SECRET to a strong key**
   - Generate a random 64+ character string
   - Update in `.env` file
   - Example: `JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

2. **MongoDB Atlas Setup** (Production Database)
   - Create account: https://www.mongodb.com/cloud/atlas
   - Create cluster (FREE tier available)
   - Get connection string
   - Update `MONGODB_URI` in `.env`

3. **SMTP Configuration** (For Email OTP)
   - Get Gmail App Password: https://support.google.com/accounts/answer/185833
   - Update `SMTP_USER` and `SMTP_PASS` in `.env`

4. **Security Hardening**
   - ✅ `.gitignore` created (secrets won't be committed)
   - ✅ Rate limiting enabled
   - ✅ CORS configured
   - ✅ Password hashing active
   - ⚠️ Change JWT_SECRET (see #1)

---

## 🌐 Hosting Options

### Option 1: Render.com (RECOMMENDED - FREE)

**Pros:**
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ MongoDB Atlas compatible
- ✅ SSL/HTTPS included
- ✅ Easy setup

**Steps:**
1. Push code to GitHub
2. Sign up at https://render.com
3. Create new "Web Service"
4. Connect your GitHub repo
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm run start:mongodb`
   - Environment Variables: Add all from `.env`
6. Deploy!

**MongoDB:**
- Use MongoDB Atlas (FREE)
- Get connection string from Atlas dashboard
- Add to Render environment variables as `MONGODB_URI`

---

### Option 2: Railway.app (FREE)

**Pros:**
- ✅ $5 free credits/month
- ✅ One-click MongoDB deployment
- ✅ Auto HTTPS
- ✅ GitHub integration

**Steps:**
1. Sign up at https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Add MongoDB plugin
5. Configure environment variables
6. Deploy!

---

### Option 3: Vercel (FREE)

**Pros:**
- ✅ Fast global CDN
- ✅ Auto HTTPS
- ✅ GitHub integration
- ✅ Free for personal projects

**Note:** Requires slight modifications for serverless deployment

---

### Option 4: DigitalOcean ($6/month)

**Pros:**
- ✅ Full control
- ✅ Dedicated resources
- ✅ Scalable

**Steps:**
1. Create Droplet (Ubuntu 22.04)
2. Install Node.js, MongoDB
3. Clone your repo
4. Setup PM2 for process management
5. Configure Nginx as reverse proxy
6. Setup SSL with Let's Encrypt

---

## 📋 Environment Variables for Production

Create these in your hosting platform:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crs

# Security (GENERATE NEW ONES!)
JWT_SECRET=YOUR_RANDOM_64_CHAR_STRING_HERE

# Email (Optional - for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OTP_EXPIRY_MINUTES=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Auto-Escalation
AUTO_ESCALATION_HOURS=72
ESCALATION_CHECK_INTERVAL=3600000
```

---

## 🔐 Security Checklist

- [ ] Changed JWT_SECRET to strong random string
- [ ] Added `.env` to `.gitignore` ✅
- [ ] MongoDB Atlas password is strong
- [ ] SMTP credentials secured
- [ ] HTTPS enabled (most platforms do this auto)
- [ ] Rate limiting enabled ✅
- [ ] CORS configured ✅
- [ ] File upload size limits set ✅
- [ ] Password hashing active ✅
- [ ] Input validation active ✅

---

## 📊 Post-Deployment Testing

After deploying, test these:

1. **Homepage loads:** `https://yourdomain.com/`
2. **Citizen portal:** `https://yourdomain.com/pages/citizen.html`
3. **Officer portal:** `https://yourdomain.com/pages/officer.html`
4. **API works:** `https://yourdomain.com/api/complaints/officer-rankings`
5. **Reviews load:** `https://yourdomain.com/api/complaints/public-reviews`
6. **Login works:** Try logging in as citizen/officer
7. **File upload:** Try submitting a complaint with attachment
8. **Analytics:** Login as officer and check analytics dashboard

---

## 🚀 Quick Deploy to Render (Easiest)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Select your repo
   - Configure:
     - Name: `complaint-resolution-system`
     - Region: Choose nearest
     - Branch: `main`
     - Build: `npm install`
     - Start: `npm run start:mongodb`
   - Add environment variables (from `.env`)
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment

3. **Setup MongoDB Atlas:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create FREE cluster
   - Get connection string
   - Add to Render env vars as `MONGODB_URI`

4. **Done!** Your app is live! 🎉

---

## 💡 Tips

- **Domain:** Use custom domain (Render supports this)
- **Backups:** MongoDB Atlas has automatic backups
- **Monitoring:** Use Render's built-in monitoring
- **Scaling:** Upgrade plan when you get more users
- **CDN:** Static files are cached automatically

---

## 🆘 Need Help?

Common issues:
- **App crashes:** Check logs in hosting dashboard
- **Database error:** Verify MONGODB_URI is correct
- **Login fails:** Check JWT_SECRET is set
- **Email not working:** Verify SMTP credentials

---

## ✅ Your Project is READY!

Just fix these before hosting:
1. Generate new JWT_SECRET
2. Setup MongoDB Atlas
3. Deploy to Render/Railway
4. Test everything

**Good luck with your deployment! 🚀**
