# Campaign Debug Checklist

## ✅ **Request Format Verification**
Your edge function is sending requests in the **EXACT** same format as your provided example:
- ✅ URL: `https://theultimate.io/WAApi/send`
- ✅ Method: `POST`
- ✅ Headers: `apikey` + `Cookie: SERVERID=webC1`
- ✅ FormData: All required fields present

## 🔍 **Step-by-Step Debug Process**

### **1. Database Issues (Most Likely Cause)**
```bash
# Apply the database migration to fix schema issues
npx supabase db push
```
**What this fixes:**
- Adds missing `user_id` field to `client_users` table
- Fixes RLS policies to use `client_id` consistently
- Ensures proper data relationships

### **2. Check Client Configuration**
Go to **Settings** page and verify:
- ✅ WhatsApp API Key is set and valid
- ✅ WhatsApp Number is set and correct
- ✅ Client account is active

### **3. Test Single Message First**
Before testing campaigns, test a single message:
1. Go to **Send Message** page
2. Add a test phone number
3. Send a simple message
4. Check for errors in browser console

### **4. Check Function Logs**
In Supabase Dashboard:
1. Go to **Functions** → **send-whatsapp-message**
2. Click **Logs** tab
3. Look for detailed error messages
4. Check the request/response details

### **5. Verify Session/Authentication**
- Ensure client is logged in
- Check if session token is valid
- Try logging out and back in

### **6. Test Edge Function Directly**
Use the test script I created:
```bash
node test-campaign-debug.js
```

## 🚨 **Common Error Messages & Solutions**

### **"WhatsApp API key not configured"**
**Solution:** Add API key in Settings page

### **"WhatsApp number not configured"**
**Solution:** Add WhatsApp number in Settings page

### **"Invalid or expired session"**
**Solution:** Log out and log back in

### **"Client account is not active"**
**Solution:** Admin needs to activate the client account

### **"Missing authorization header"**
**Solution:** Session token issue - re-login

### **Database permission errors**
**Solution:** Apply the database migration

## 📋 **What Requests Are Being Sent**

### **Campaign Creation Request:**
```javascript
POST /campaigns
{
  name: "Campaign Name",
  description: "Campaign Description",
  message_content: "Your message content",
  message_type: "text",
  target_groups: ["group_id"],
  user_id: "client_id",
  client_id: "client_id",
  group_id: "group_id",
  template_id: "template_id",
  status: "sending",
  scheduled_for: null,
  variable_mappings: {}
}
```

### **WhatsApp API Request (for each contact):**
```javascript
POST https://theultimate.io/WAApi/send
Headers: {
  'apikey': 'your_whatsapp_api_key',
  'Cookie': 'SERVERID=webC1'
}
FormData: {
  userid: "client_user_id",
  msg: "message_content",
  wabaNumber: "client_whatsapp_number",
  output: "json",
  mobile: "recipient_phone",
  sendMethod: "quick",
  msgType: "text",
  templateName: "template_name" // if provided
}
```

## 🎯 **Quick Fix Steps**

1. **Apply Database Migration:**
   ```bash
   npx supabase db push
   ```

2. **Deploy Updated Function:**
   ```bash
   npx supabase functions deploy send-whatsapp-message
   ```

3. **Test Single Message:**
   - Go to Send Message page
   - Send a test message
   - Check for errors

4. **Check Function Logs:**
   - Supabase Dashboard → Functions → Logs
   - Look for detailed error messages

5. **Verify Client Settings:**
   - API Key is set
   - WhatsApp Number is set
   - Account is active

## 🔧 **If Still Not Working**

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed requests
3. **Check Function Logs** for server-side errors
4. **Test with Postman** using the exact request format
5. **Verify WhatsApp API credentials** are valid

The request format is correct - the issue is likely database schema or configuration related. 