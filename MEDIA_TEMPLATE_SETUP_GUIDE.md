# Media Template Setup Guide

## Understanding the "Missing headerFile" Error

When creating **media templates** (templates with images, videos, or documents), the WhatsApp API requires a `headerFile` parameter that contains a **real, publicly accessible media file URL**.

## What is headerFile?

The `headerFile` is the URL of the media file (image, video, or document) that will be displayed in the header of your WhatsApp template message.

## How to Get a Valid Media File URL

### Option 1: Upload to Your Media Management System (Recommended)
1. Go to **Media Management** in your dashboard
2. Upload your media file (image, video, or document)
3. Copy the generated URL
4. Use this URL as the `headerFile` in your template

### Option 2: Use a Public Image Service
- **Picsum Photos**: `https://picsum.photos/300/200` (random images)
- **Placeholder.com**: `https://via.placeholder.com/300x200/0066cc/ffffff?text=Your+Text`
- **Your own hosted images**: `https://yourdomain.com/images/your-image.jpg`

### Option 3: Upload to Cloud Storage
- **AWS S3**: Upload and get the public URL
- **Google Cloud Storage**: Upload and make public
- **Cloudinary**: Upload and get the delivery URL
- **ImgBB**: Upload and get the direct link

## Requirements for Media Files

### Image Files
- **Formats**: JPG, JPEG, PNG, GIF
- **Size**: Maximum 5MB
- **Dimensions**: Recommended 300x200 pixels or larger
- **Access**: Must be publicly accessible via HTTP/HTTPS

### Video Files
- **Formats**: MP4, 3GP
- **Size**: Maximum 16MB
- **Duration**: Maximum 3 minutes
- **Access**: Must be publicly accessible via HTTP/HTTPS

### Document Files
- **Formats**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Size**: Maximum 100MB
- **Access**: Must be publicly accessible via HTTP/HTTPS

## Example Valid URLs

```javascript
// Images
"https://picsum.photos/300/200"
"https://via.placeholder.com/300x200/0066cc/ffffff?text=Welcome"
"https://yourdomain.com/images/logo.png"

// Videos
"https://yourdomain.com/videos/intro.mp4"
"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

// Documents
"https://yourdomain.com/documents/catalog.pdf"
"https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
```

## Testing Your Media URL

Before using a URL in your template:

1. **Test the URL**: Open it in a browser to ensure it loads
2. **Check accessibility**: Make sure it's publicly accessible
3. **Verify format**: Ensure it matches your selected media type
4. **Check size**: Ensure it's within WhatsApp's size limits

## Common Issues and Solutions

### "Missing headerFile" Error
**Cause**: The URL provided is not accessible or invalid
**Solution**: Use a real, publicly accessible media file URL

### "Invalid media format" Error
**Cause**: The file format doesn't match the selected media type
**Solution**: Ensure the file extension matches your media type selection

### "File too large" Error
**Cause**: The media file exceeds WhatsApp's size limits
**Solution**: Compress the file or use a smaller version

### "URL not accessible" Error
**Cause**: The URL requires authentication or is private
**Solution**: Make sure the file is publicly accessible

## Best Practices

1. **Use your own media**: Upload files to your media management system
2. **Optimize files**: Compress images and videos for faster loading
3. **Test URLs**: Always test media URLs before creating templates
4. **Keep backups**: Store original files in case you need to re-upload
5. **Use HTTPS**: Always use HTTPS URLs for security

## Quick Test

To quickly test if your media template setup works:

1. Use this test image URL: `https://picsum.photos/300/200`
2. Create a media template with this URL
3. If it works, you can replace it with your own media file URL
