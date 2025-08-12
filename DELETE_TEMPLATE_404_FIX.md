# 🚨 Delete Template 404 Error - Fix Guide

## ❌ **Problem Identified**

The delete template functionality is returning a **404 error** because the `/api/delete-template` endpoint is not available on the deployed Vercel instance.

### **Error Details:**
```
api/delete-template:1 Failed to load resource: the server responded with a status of 404 (Not Found)
Error deleting template: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### **Root Cause:**
- The `api/delete-template.js` file exists locally but hasn't been deployed to Vercel
- The frontend is trying to access `/api/delete-template` but getting an HTML 404 page instead of JSON

## ✅ **Solution Steps**

### **1. Deploy the New API Endpoint**

**Option A: Using the deployment script (Recommended)**
```bash
# On Windows:
deploy-delete-template.bat

# On Mac/Linux:
chmod +x deploy-delete-template.sh
./deploy-delete-template.sh
```

**Option B: Manual deployment**
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### **2. Verify the Deployment**

After deployment, verify the endpoint is working:

**Test locally (if using development server):**
```javascript
// Copy and paste this in browser console
fetch('/api/delete-template', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'test',
    password: 'test',
    wabaNumber: 'test',
    templateName: 'test',
    language: 'en'
  })
}).then(r => r.text()).then(console.log);
```

**Test on deployed site:**
```bash
curl -X DELETE https://your-domain.vercel.app/api/delete-template \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","password":"test","wabaNumber":"test","templateName":"test","language":"en"}'
```

### **3. Check Vercel Configuration**

Ensure `vercel.json` includes the delete template function:

```json
{
  "functions": {
    "api/delete-template.js": {
      "maxDuration": 30
    }
  }
}
```

## 🔧 **Files Created/Modified**

### **New Files:**
- ✅ `api/delete-template.js` - Vercel serverless function
- ✅ `deploy-delete-template.sh` - Linux/Mac deployment script
- ✅ `deploy-delete-template.bat` - Windows deployment script
- ✅ `test-delete-template.js` - Test script for verification

### **Updated Files:**
- ✅ `vercel.json` - Added delete template function configuration
- ✅ `proxy-server.js` - Added delete template endpoint
- ✅ `src/pages/TemplateManagement.tsx` - Added delete functionality with trash icons

## 🎯 **Expected Results After Fix**

1. **Individual Delete:** Click trash icon → Confirmation dialog → Template deleted
2. **Bulk Delete:** Click "Delete All" → Confirmation dialog → All templates deleted
3. **Success Feedback:** Toast notifications for successful operations
4. **Error Handling:** Proper error messages for failed operations
5. **Auto Refresh:** Template list updates automatically after deletion

## 🚀 **Quick Fix Commands**

```bash
# 1. Deploy immediately
npm run build && vercel --prod

# 2. Or use the deployment script
./deploy-delete-template.sh  # Linux/Mac
deploy-delete-template.bat   # Windows
```

## 📋 **Verification Checklist**

- [ ] `api/delete-template.js` file exists in project
- [ ] `vercel.json` includes delete template function
- [ ] Deployment completed successfully
- [ ] `/api/delete-template` endpoint responds (not 404)
- [ ] Delete buttons appear on template cards
- "Delete All" button appears in header
- [ ] Confirmation dialogs work
- [ ] Success/error toasts appear
- [ ] Template list refreshes after deletion

## 🆘 **If Still Getting 404**

1. **Check Vercel logs:** `vercel logs`
2. **Verify file structure:** Ensure `api/delete-template.js` is in the correct location
3. **Force redeploy:** `vercel --prod --force`
4. **Check function list:** `vercel functions ls`

---

**Status:** ✅ **Ready for deployment** - All files created and configured correctly
