# Wallet Balance Feature

## Overview

The Wallet Balance feature displays the client's account balance on the dashboard. It fetches real-time balance information from the theultimate.io API and presents it in a user-friendly format.

## Features

### ✅ **Real-time Balance Display**
- Shows current balance in Indian Rupees (₹)
- Displays account expiry date
- Auto-refresh capability with manual refresh button
- Loading states and error handling

### ✅ **Dashboard Integration**
- Prominent wallet balance card for clients
- Admin dashboard includes wallet management option
- Responsive design for all screen sizes

### ✅ **API Integration**
- Uses theultimate.io SMS API endpoint
- Secure credential handling
- CORS-compliant proxy endpoints

## API Details

### **Endpoint**
```
GET https://theultimate.io/SMSApi/account/readstatus?userid={{USER_ID}}&output=json
```

### **Headers**
```
apikey: {{API_KEY}}
Cookie: PHPSESSID=m2s8rvll7rbjkhjk0jno1gb01t; SERVERNAME=s1
```

### **Response Format**
```json
{
  "response": {
    "api": "account",
    "action": "readstatus",
    "status": "success",
    "msg": "success",
    "code": "200",
    "count": 5,
    "account": {
      "expDate": "1774895400000",
      "userCreditType": "2",
      "endHour": "2055",
      "startHour": "900",
      "smsBalance": "308595.8761"
    }
  }
}
```

## Implementation

### **Frontend Components**

#### 1. **useWalletBalance Hook** (`src/hooks/useWalletBalance.tsx`)
```typescript
const { balance, loading, error, fetchWalletBalance, formatBalance, formatExpiryDate } = useWalletBalance();
```

**Features:**
- Automatic balance fetching on component mount
- Manual refresh functionality
- Balance formatting with commas and decimals
- Date formatting for expiry display
- Error handling and loading states

#### 2. **Dashboard Integration** (`src/pages/Dashboard.tsx`)
```typescript
{/* Wallet Balance Card - Prominent for clients */}
{!isAdmin && (
  <Card className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-green-600" />
          <p className="text-sm font-medium text-gray-700">Wallet Balance</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWalletBalance}
          disabled={walletLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${walletLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="space-y-1">
        {walletLoading ? (
          <p className="text-2xl font-bold text-gray-400">...</p>
        ) : walletError ? (
          <p className="text-sm text-red-600">Error loading balance</p>
        ) : balance ? (
          <>
            <p className="text-2xl font-bold text-green-700">
              ₹{formatBalance(balance.smsBalance)}
            </p>
            <p className="text-xs text-gray-500">
              Expires: {formatExpiryDate(balance.expDate)}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">No balance data</p>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

### **Backend API Endpoints**

#### 1. **Vercel Function** (`api/fetch-wallet-balance.js`)
- Handles CORS and authentication
- Proxies requests to theultimate.io API
- Returns formatted response

#### 2. **Local Development Proxy** (`proxy-server.js`)
- Development endpoint for local testing
- Same functionality as Vercel function
- Detailed logging for debugging

## Usage

### **For Clients**
1. **View Balance**: Wallet balance is automatically displayed on the dashboard
2. **Refresh Balance**: Click the refresh icon to update the balance
3. **Monitor Expiry**: Check the expiry date to ensure account remains active

### **For Admins**
1. **Client Overview**: Access wallet management through admin dashboard
2. **Balance Monitoring**: Track client account balances
3. **Expiry Alerts**: Monitor account expiry dates

## Testing

### **Test File** (`test-wallet-balance.js`)
```javascript
const testData = {
  userId: 'nandlalwa',
  apiKey: '6c690e3ce94a97dd3bc5349d215f293bae88963c'
};

const response = await fetch('http://localhost:3001/api/fetch-wallet-balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
});
```

### **Running Tests**
```bash
# Test wallet balance API
node test-wallet-balance.js

# Test with proxy server running
npm run dev
```

## Error Handling

### **Common Issues**

#### 1. **Missing Credentials**
- **Error**: "Missing userId or apiKey"
- **Solution**: Ensure client has valid API credentials

#### 2. **Invalid API Key**
- **Error**: "HTTP error! status: 401"
- **Solution**: Verify API key is correct and active

#### 3. **Account Expired**
- **Error**: API returns expired account status
- **Solution**: Renew client account

#### 4. **Network Issues**
- **Error**: "Failed to fetch wallet balance"
- **Solution**: Check internet connection and API availability

### **Error States in UI**
- **Loading**: Shows "..." while fetching
- **Error**: Shows "Error loading balance" with red text
- **No Data**: Shows "No balance data" in gray text

## Security Considerations

### **Credential Protection**
- API keys are never logged in full
- Only last 4 characters are shown in logs
- Credentials are transmitted securely

### **CORS Handling**
- Proper CORS headers for cross-origin requests
- Preflight request handling
- Secure cookie management

## Future Enhancements

### **Planned Features**
1. **Low Balance Alerts**: Notify when balance is below threshold
2. **Balance History**: Track balance changes over time
3. **Auto-refresh**: Periodic balance updates
4. **Multiple Currency Support**: Support for different currencies
5. **Balance Charts**: Visual representation of balance trends

### **Admin Features**
1. **Bulk Balance Check**: Check all client balances at once
2. **Balance Reports**: Generate balance reports
3. **Expiry Notifications**: Alert admins about expiring accounts

## Configuration

### **Environment Variables**
```bash
# API Configuration
SMS_API_BASE_URL=https://theultimate.io/SMSApi
SMS_API_COOKIE=PHPSESSID=m2s8rvll7rbjkhjk0jno1gb01t; SERVERNAME=s1
```

### **Client Configuration**
- `user_id`: Client's login user ID
- `whatsapp_api_key`: Client's API key
- Both are stored in the client's profile

## Troubleshooting

### **Debug Steps**
1. **Check Credentials**: Verify user_id and apiKey are correct
2. **Test API Directly**: Use curl to test the API endpoint
3. **Check Network**: Ensure proxy server is running
4. **Review Logs**: Check browser console and server logs
5. **Verify Response**: Confirm API returns expected format

### **Common Solutions**
- **Restart Proxy Server**: If local development issues
- **Clear Browser Cache**: If UI shows stale data
- **Check API Status**: Verify theultimate.io API is operational
- **Update Credentials**: Refresh client API credentials if needed
