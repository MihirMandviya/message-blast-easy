# Vercel Deployment Guide

## 🚀 Quick Deploy

### Option 1: Using the deploy script
```bash
npm run deploy
```

### Option 2: Manual deployment
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## 🔧 Fixes Applied

### 1. MIME Type Error Fix
The "Failed to load module script" error has been fixed by:

- ✅ Updated `vercel.json` with proper MIME type headers
- ✅ Added comprehensive file type handling
- ✅ Configured proper build settings
- ✅ Added framework specification for Vite

### 2. CORS Issues Fixed
- ✅ Updated all API functions with comprehensive CORS headers
- ✅ Added platform-level CORS configuration
- ✅ Fixed preflight request handling

## 📁 Key Configuration Files

### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "routes": [
    // API routes with CORS
    // Static file routes with proper MIME types
    // SPA fallback route
  ]
}
```

### vite.config.ts
```typescript
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    }
  }
})
```

## 🛠️ Troubleshooting

### If you still see MIME type errors:

1. **Clear Vercel cache:**
   ```bash
   vercel --force
   ```

2. **Rebuild and redeploy:**
   ```bash
   npm run build:vercel
   vercel --prod
   ```

3. **Check build output:**
   ```bash
   ls -la dist/
   ```

### If CORS errors persist:

1. **Test API endpoints:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/test-cors
   ```

2. **Check Vercel function logs:**
   ```bash
   vercel logs
   ```

## 📋 Pre-deployment Checklist

- [ ] All API functions have proper CORS headers
- [ ] Vite configuration is optimized for production
- [ ] Vercel configuration includes proper MIME types
- [ ] Build script works locally (`npm run build`)
- [ ] Environment variables are set in Vercel dashboard

## 🎯 Expected Results

After deployment, you should see:
- ✅ No MIME type errors in browser console
- ✅ API calls work without CORS issues
- ✅ Static assets load correctly
- ✅ Client-side routing works properly

## 🔄 Update Process

To update your deployment:

1. **Make your changes**
2. **Test locally:** `npm run dev`
3. **Build locally:** `npm run build`
4. **Deploy:** `npm run deploy`

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify build output in `dist/` folder
3. Test API endpoints individually
4. Check browser console for specific errors
