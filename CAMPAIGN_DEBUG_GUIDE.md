# Campaign Debug Guide

## Issues and Solutions

### 1. CORS Error: "Access to fetch at 'https://theultimate.io/WAApi/send' has been blocked by CORS policy"

**Problem**: The browser is trying to make a direct API call to the WhatsApp API from the frontend, which is blocked by CORS.

**Solution**: ✅ **FIXED** - The API calls now go through the Supabase Edge Function which handles CORS properly.

**What was changed**:
- Updated the "Test API" button to use the edge function instead of direct API calls
- All campaign sending now goes through the edge function (`/functions/v1/send-whatsapp-message`)

### 2. "No contacts found in the selected group"

**Problem**: Campaigns are being created but fail to send because the selected group has no contacts.

**Root Cause**: The `contact_groups` junction table is empty - contacts haven't been added to groups.

**Solutions**:

#### Option A: Add Contacts to Groups
1. Go to **Contact Management** page
2. Create contacts or import them
3. Go to **Groups** section
4. Add contacts to the group you want to use for campaigns

#### Option B: Use a Group with Existing Contacts
1. Check which groups have contacts (the contact count is shown in the dropdown)
2. Select a group that shows a contact count > 0

#### Option C: Create a New Group with Contacts
1. Create a new group in Contact Management
2. Add contacts to this group
3. Use this group for your campaign

### 3. Enhanced Validation and User Experience

**New Features Added**:

1. **Visual Warning**: Groups with 0 contacts now show a warning message
2. **Validation Check**: Campaign creation is blocked if the selected group has no contacts
3. **Enhanced Debug**: The debug button now shows detailed information about contacts and groups
4. **Better Error Messages**: Clear explanations of what went wrong and how to fix it

## How to Test

### 1. Test API Connection
- Click the "Test API" button
- This will test the edge function connection
- Check console for detailed logs

### 2. Debug Database Access
- Click the "Debug" button
- This will show:
  - Available campaigns, groups, templates
  - Contact counts for each group
  - Contact-group relationships

### 3. Create a Working Campaign
1. Ensure you have contacts in a group
2. Select a group with contacts > 0
3. Choose a template
4. Map any variables
5. Create the campaign

## Database Structure

The campaign system uses these tables:
- `campaigns` - Stores campaign information
- `groups` - Contact lists/segments
- `contacts` - Individual contact information
- `contact_groups` - Junction table linking contacts to groups
- `templates` - Message templates
- `messages` - Individual message records

## Common Issues and Fixes

### Issue: "Contact groups found: 0"
**Fix**: Add contacts to the group using Contact Management

### Issue: "No contacts found in the selected group"
**Fix**: Select a different group or add contacts to the current group

### Issue: "Authentication Error"
**Fix**: Log out and log back in to refresh your session

### Issue: "Template not found"
**Fix**: Ensure the template exists and belongs to your account

## Next Steps

1. **Add Contacts**: Use the Contact Management page to add contacts to your groups
2. **Test API**: Use the "Test API" button to verify the WhatsApp API connection
3. **Create Campaign**: Once you have contacts in a group, create your campaign
4. **Monitor**: Check the campaign status and message delivery

## Support

If you continue to experience issues:
1. Use the "Debug" button to gather information
2. Check the browser console for detailed error logs
3. Ensure your WhatsApp API credentials are configured in Settings
4. Verify that your WhatsApp number is active and approved 