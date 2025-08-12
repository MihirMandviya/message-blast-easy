# Quick Fix: Wallet Balance Not Loading

## Problem
You're seeing "Unable to load balance" instead of your wallet balance.

## Solution
The wallet balance requires the proxy server to be running. Here's how to fix it:

### Step 1: Start the Proxy Server

**Windows:**
```bash
# Option 1: Double-click this file
start-proxy.bat

# Option 2: Run in terminal
node proxy-server.js
```

**Mac/Linux:**
```bash
# Option 1: Run the script
./start-proxy.sh

# Option 2: Run directly
node proxy-server.js
```

### Step 2: Verify Proxy Server is Running

You should see:
```
Proxy server running on http://localhost:3001
```

### Step 3: Refresh the Dashboard

1. Go back to your browser
2. Refresh the dashboard page
3. The wallet balance should now load

## Alternative: Use the Quick Start Script

**Windows:**
```bash
# This starts both servers automatically
start-dev.bat
```

**Mac/Linux:**
```bash
# This starts both servers automatically
./start-dev.sh
```

## What's Happening

- The frontend (React app) runs on `http://localhost:5173`
- The API proxy runs on `http://localhost:3001`
- The wallet balance API endpoint is `/api/fetch-wallet-balance`
- Without the proxy server, this endpoint returns 404 (not found)

## Production Deployment

When deployed to Vercel, the API functions work automatically without needing a separate proxy server.

## Still Having Issues?

1. **Check if port 3001 is available:**
   ```bash
   # Windows
   netstat -an | findstr 3001
   
   # Mac/Linux
   lsof -i :3001
   ```

2. **Check the logs:**
   - Look for `api-requests.log` file
   - Check browser console for errors

3. **Verify credentials:**
   - Make sure you're logged in as a client
   - Check that the client has API credentials set
