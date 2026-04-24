# Multimedia Complaint Feature Guide

## 🎯 Overview
Users can now submit complaints with multimedia evidence including:
- 📸 **Photos** (JPG, PNG, GIF, WebP)
- 🎥 **Videos** (MP4, AVI, MOV, MKV, WebM)
- 🎤 **Voice Messages** (Recorded directly in the browser)

## ✨ Features

### 1. Photo/Video Upload
- **Maximum Files**: 5 files per complaint
- **File Size Limit**: 50MB per file
- **Supported Formats**:
  - Images: JPG, PNG, GIF, WebP
  - Videos: MP4, AVI, MOV, MKV, WebM
- **Live Preview**: See thumbnails before submission
- **Multiple Upload**: Select multiple files at once

### 2. Voice Recording
- **Direct Recording**: Record voice messages directly in the browser
- **Max Duration**: 5 minutes per recording
- **Live Timer**: Shows recording duration in real-time
- **Playback Preview**: Listen to recording before submission
- **One-Click Record**: Simple start/stop interface

## 📱 How to Use

### For Citizens:

1. **Login** to the Citizen Portal
2. Navigate to **"File New Complaint"** section
3. Fill in the complaint details (Title, Description, Location, Category, Priority)
4. **Add Evidence** (Optional):
   
   #### To Upload Photos/Videos:
   - Click on the **"Photos/Video"** tab
   - Click **"Choose Files"** or drag & drop
   - Select up to 5 images or videos
   - Preview thumbnails will appear
   
   #### To Record Voice Message:
   - Click on the **"Voice Message"** tab
   - Click the **red microphone button** to start recording
   - Speak your message (timer shows duration)
   - Click the button again to stop
   - Listen to playback using the audio player
   - Click **"Clear Recording"** to re-record

5. Click **"Submit Complaint"**
6. Your complaint will be submitted with all attached media files

## 🔧 Technical Details

### Backend Changes:
- **Multer Middleware**: Handles file uploads with validation
- **Storage**: Files stored in `/uploads/complaints/` directory
- **Database**: MongoDB stores file metadata and URLs
- **Validation**: File type and size validation on server

### Frontend Changes:
- **MediaRecorder API**: Browser-based voice recording
- **FileReader API**: Image/video preview generation
- **FormData**: Multipart file upload handling
- **Responsive UI**: Mobile-friendly upload interface

### API Endpoint:
```
POST /api/complaints/create
Content-Type: multipart/form-data

Fields:
- title: string
- description: string
- location: string
- category: string
- priority: string
- name: string
- email: string
- phone: string
- attachments: [files] (up to 5 files)
```

### Database Schema Updates:
```javascript
{
  mediaType: 'text' | 'photo' | 'video' | 'voice' | 'multiple',
  attachments: [
    {
      filename: string,
      originalName: string,
      path: string,
      url: string,
      type: 'image' | 'video' | 'audio',
      mimeType: string,
      size: number
    }
  ],
  voiceRecording: {
    filename: string,
    path: string,
    url: string,
    duration: number,
    size: number
  }
}
```

## 📂 File Structure

```
uploads/
└── complaints/
    ├── complaint-1234567890-image.jpg
    ├── complaint-1234567890-video.mp4
    └── complaint-1234567890-voice.webm
```

## 🔒 Security Features

- **File Type Validation**: Only allowed mime types accepted
- **File Size Limit**: 50MB maximum per file
- **File Count Limit**: Maximum 5 files per complaint
- **Unique Filenames**: Timestamp + random number prevents conflicts
- **Server Validation**: Double validation on backend

## 🌐 Access Uploaded Files

Files are served at:
```
http://localhost:3000/uploads/complaints/<filename>
```

## 💡 Tips

1. **Compress Large Files**: Compress videos before uploading for faster submission
2. **Clear Voice**: Record in a quiet environment for better quality
3. **Multiple Angles**: Upload multiple photos to show the issue from different perspectives
4. **Check Permissions**: Allow microphone access when prompted for voice recording
5. **Preview Before Submit**: Review all files and recordings before submission

## 🐛 Troubleshooting

### Voice Recording Not Working?
- Check browser microphone permissions
- Use HTTPS in production (required for microphone access)
- Try Chrome or Firefox for best compatibility

### File Upload Fails?
- Check file size (max 50MB)
- Verify file format is supported
- Check internet connection stability

### Preview Not Showing?
- Refresh the page
- Check browser console for errors
- Ensure files are valid images/videos

## 🚀 Future Enhancements

- [ ] Image compression before upload
- [ ] Video trimming functionality
- [ ] Drag & drop file upload
- [ ] Progress bar for large uploads
- [ ] Image annotation/markup
- [ ] Multiple voice recordings per complaint
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Real-time upload progress

## 📞 Support

For issues or questions about the multimedia feature, please contact the development team.
