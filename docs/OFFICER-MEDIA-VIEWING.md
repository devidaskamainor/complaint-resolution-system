# Officer Media Viewing Guide

## 📸 How Officers View Photos, Videos & Voice Recordings

### Overview
Officers can now view all multimedia evidence attached to complaints submitted by citizens. This includes photos, videos, and voice recordings with authenticity verification scores.

---

## 🔍 Step-by-Step Guide

### 1. **Login to Officer Portal**
- Go to: http://localhost:3000/officer
- Login with your officer credentials

### 2. **Navigate to Manage Complaints**
- After login, scroll to "Manage Complaints" section
- You'll see a table of all complaints

### 3. **Identify Complaints with Media** 🎯
Complaints with attachments show **icon indicators** next to the title:

| Icon | Meaning |
|------|---------|
| 📷 🖼️ | Has **Photos** |
| 🎥 | Has **Video** |
| 🎤 | Has **Voice Recording** |
| 📎 | Has **Multiple Attachments** |

**Example:**
```
C000001  Broken Street Light 📷
C000002  Road Pothole 🎥
C000003  Water Leak 🎤
C000004  Garbage Issue 📎
```

### 4. **View Complaint Details**
- Click the **"View"** button (green) on any complaint
- A modal window opens with full details

### 5. **View Attached Evidence** 📁

In the details modal, scroll down to see:

#### **📸 Photos**
- Displayed as thumbnail cards in a grid
- Click any photo to open full-size in new tab
- Shows:
  - Original filename
  - File size
  - ✅ Authenticity verification score (if available)

**Example:**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   [Photo]   │ │   [Photo]   │ │   [Photo]   │
│ image1.jpg  │ │ image2.jpg  │ │ image3.jpg  │
│ 245.3 KB    │ │ 312.1 KB    │ │ 189.7 KB    │
│ ✅ Verified │ │ ✅ Verified │ │ ⚠️ 65%      │
│   95%       │ │   88%       │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### **🎥 Videos**
- Embedded video player with controls
- Shows:
  - Original filename
  - File size in MB
  - Play/pause/seek controls

**Example:**
```
┌──────────────────────────────────┐
│  [▶️ Video Player]                │
│  [====|==========] 0:45 / 2:30   │
│  road-damage.mp4                 │
│  15.23 MB                        │
└──────────────────────────────────┘
```

#### **🎤 Voice Recordings**
- Audio player with playback controls
- Shows:
  - Duration in seconds
  - File size
  - ✅ Authenticity verification score

**Example:**
```
┌──────────────────────────────────┐
│ 🎤 Voice Recording               │
│ [▶️ Audio Player]                 │
│ [====|==========] 0:15 / 0:45    │
│ Duration: 45 seconds             │
│ Size: 523.4 KB                   │
│ ✅ Authenticity: 92%             │
└──────────────────────────────────┘
```

---

## 🛡️ Authenticity Verification

All uploaded media is automatically checked for AI-generated or fake content:

### **Verification Scores:**
- **✅ 70-100%**: Authentic (Green) - Likely real content
- **⚠️ 50-69%**: Suspicious (Yellow) - May be manipulated
- **❌ < 50%**: Rejected (Red) - Likely AI-generated/fake

### **What Officers Should Know:**
- Only **verified content** reaches the complaint (fake files are auto-rejected)
- Higher confidence = more reliable evidence
- Use authenticity scores as a guide for evidence credibility

---

## 📋 Complaint Details Modal

The modal shows information in this order:

1. **Citizen Information** (Top Left)
   - Name, Email, Phone

2. **Complaint Details** (Top Right)
   - ID, Title, Category, Priority, Status, Location, Date

3. **Description** (Middle)
   - Full complaint description

4. **Attached Evidence** (If any) 📎
   - Photos grid
   - Video player(s)
   - Voice recording player

5. **Timeline** (Bottom)
   - History of status changes
   - Notes and updates

---

## 💡 Tips for Officers

### **Viewing Photos:**
- Click any photo to see it full-size
- Use browser zoom for details
- Photos open in new tab for better viewing

### **Watching Videos:**
- Use fullscreen mode for better visibility
- Videos have standard playback controls
- Can pause, rewind, and adjust volume

### **Listening to Voice Recordings:**
- Use headphones for better audio quality
- Can adjust playback speed (browser dependent)
- Replay as needed for clarity

### **Assessing Evidence:**
- Check authenticity scores for reliability
- Multiple attachments provide better context
- Compare photos/videos with complaint description

---

## 🎨 Visual Indicators

### **In Complaints Table:**
```
ID       Title                    Citizen        Category    Status
C000001  Broken Light 📷          John Doe       Electricity Pending
C000002  Road Damage 🎥           Jane Smith     Roads       In Progress
C000003  Water Leak               Bob Johnson    Water       Resolved
C000004  Garbage Issue 📎         Alice Brown    Sanitation  Pending
```

### **In Details Modal:**
```
📎 Attached Evidence (photo)

┌─────────────┐ ┌─────────────┐
│  [Image]    │ │  [Image]    │
│  photo.jpg  │ │  image.png  │
│  245.3 KB   │ │  312.8 KB   │
│  ✅ 95%     │ │  ✅ 88%     │
└─────────────┘ └─────────────┘

🎤 Voice Recording
[Audio Player]
Duration: 32 seconds | Size: 412.5 KB
✅ Authenticity: 91%
```

---

## 🔧 Technical Details

### **Where Files Are Stored:**
- Server path: `/uploads/complaints/`
- Access URL: `http://localhost:3000/uploads/complaints/<filename>`
- Files are served statically by Express

### **Supported Formats:**
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, MKV, WebM
- **Audio**: WebM (voice recordings)

### **File Size Limits:**
- Maximum 50MB per file
- Maximum 5 files per complaint
- Voice recordings: up to 5 minutes

---

## ❓ FAQ

**Q: Can I download the photos/videos?**  
A: Yes! Right-click on images and select "Save Image As". For videos/audio, use browser download options.

**Q: What if a photo doesn't load?**  
A: Check your internet connection. If the issue persists, the file may have been deleted or corrupted.

**Q: Can I see who uploaded the media?**  
A: Yes, the citizen's name and email are shown at the top of the details modal.

**Q: How accurate is the authenticity score?**  
A: The system detects ~85-90% of common AI generators. Use it as a guide, not absolute proof.

**Q: Can I add notes about the evidence?**  
A: Currently, you can view evidence. Adding notes about evidence is a planned future feature.

---

## 🚀 Future Enhancements

- [ ] Download all attachments as ZIP
- [ ] Add officer notes/annotations on evidence
- [ ] Side-by-side photo comparison
- [ ] Video screenshot capture
- [ ] Voice recording transcript
- [ ] Evidence sharing with other officers
- [ ] Print evidence report

---

## 📞 Support

If you encounter issues viewing media:
1. Check browser console for errors (F12)
2. Verify file exists at `/uploads/complaints/`
3. Ensure server is running
4. Contact technical support
