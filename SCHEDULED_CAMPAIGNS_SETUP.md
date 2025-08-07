# Scheduled Campaigns Setup

## Overview
The scheduled campaigns feature allows you to automatically send campaigns at a specified date and time. This document explains how to set up the automated processing.

## Current Implementation

### 1. Edge Function
- **Function Name**: `process-scheduled-campaigns`
- **Purpose**: Processes all scheduled campaigns that are due to be sent
- **Deployment**: Already deployed to Supabase

### 2. Automatic Processing
The application automatically checks for overdue scheduled campaigns:
- **On page load**: Checks immediately when the campaigns page loads
- **Every 5 minutes**: Automatically checks for overdue campaigns
- **Manual trigger**: "Process Scheduled" button for manual processing

### 3. How It Works
1. The system queries for campaigns with status 'scheduled' and scheduled_for <= current time
2. For each overdue campaign:
   - Updates status to 'sending'
   - Fetches contacts from the target group
   - Creates message records for each contact
   - Updates campaign status to 'sent' with counts

## Setting Up Automated Cron Job (Optional)

For production use, you may want to set up a proper cron job. Here are the options:

### Option 1: External Cron Service
Use a service like cron-job.org or GitHub Actions to call the edge function:

```bash
# Call this URL every minute
curl -X POST https://your-project.supabase.co/functions/v1/process-scheduled-campaigns
```

### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Database > Functions
3. Set up a cron job using the Supabase cron extension (if available)

### Option 3: Vercel Cron Jobs
If hosting on Vercel, create a cron job in vercel.json:

```json
{
  "crons": [
    {
      "path": "/api/process-scheduled-campaigns",
      "schedule": "* * * * *"
    }
  ]
}
```

## Manual Testing

To test the scheduled campaigns feature:

1. Create a campaign with status 'scheduled' and a past date
2. Click the "Process Scheduled" button
3. Check the campaign status changes to 'sent'

## Troubleshooting

### Campaigns Not Processing
1. Check the browser console for errors
2. Verify the edge function is deployed correctly
3. Check that campaigns have the correct status and scheduled_for date

### No Contacts Found
1. Verify contacts exist in the target group
2. Check that the user_id matches the campaign's user_id
3. Ensure RLS policies allow access to contacts

### Edge Function Errors
1. Check Supabase function logs in the dashboard
2. Verify environment variables are set correctly
3. Test the function manually via the dashboard

## Current Status
✅ Edge function deployed and working
✅ Automatic checking implemented
✅ Manual processing available
✅ UI indicators for overdue campaigns
⏳ External cron job setup (optional for production) 