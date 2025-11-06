# Mobile Connection Debug Guide

## Current Issue
The mobile device is sending "Session ID is missing" or "Session ID is literally 'null'" errors, indicating the session ID is not being properly passed from the QR code to the mobile camera page.

## Debug Steps Applied

### 1. ✅ Fixed Session ID in Request Body
Changed from query parameters to request body format:
```javascript
// Before (causing error)
fetch(`/api/setup/mobile-camera?sessionId=${sessionId}&connected=${connected}`)

// After (fixed)
fetch('/api/setup/mobile-camera', {
  body: JSON.stringify({ sessionId, connected, ... })
})
```

### 2. ✅ Added Comprehensive Logging
Added detailed logging to track session ID flow:
```javascript
console.log('[Mobile Camera] Page loaded, checking for session ID');
console.log('[Mobile Camera] Search params:', searchParams?.toString());
console.log('[Mobile Camera] Session ID from URL:', urlSessionId);
```

### 3. ✅ Enhanced Mode Detection
The mobile camera now detects enhanced mode from URL parameters:
```javascript
const enhanced = searchParams.get('enhanced') === 'true' || searchParams.get('fps') === '30';
```

## Testing Instructions

### Step 1: Check QR Code URL
The QR code should contain a URL like:
```
http://192.168.1.100:3000/mobile-camera?sessionId=6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba&enhanced=true&fps=30
```

**Verify:**
- Contains valid session ID (not null or empty)
- Has `enhanced=true` parameter
- Uses network IP (not localhost)

### Step 2: Test Mobile Console
When scanning the QR code, mobile browser console should show:
```
[Mobile Camera] Page loaded, checking for session ID
[Mobile Camera] Search params: sessionId=6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba&enhanced=true&fps=30
[Mobile Camera] Session ID from URL: 6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba
[Mobile Camera] Using valid session ID from URL: 6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba
[Mobile Camera] Enhanced mode requested - using optimized settings
```

### Step 3: Check Server Logs
Server should now show:
```
Mobile camera connection update for session 6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba: connected
Updated connection for session: 6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba
```

**NOT:**
```
Session ID is missing in mobile-camera POST request
Session ID is literally "null" string - rejecting request
```

## Debug Commands

### Check Current QR Code URL
In desktop browser console:
```javascript
// Check what URL the QR code contains
console.log('QR Code URL:', document.querySelector('canvas').parentElement.dataset.url);
```

### Test Session ID Manually
In mobile browser console:
```javascript
// Check if session ID is being detected
const params = new URLSearchParams(window.location.search);
console.log('Session ID:', params.get('sessionId'));
console.log('Enhanced:', params.get('enhanced'));
```

### Test API Directly
```javascript
// Test connection status API
fetch('/api/setup/mobile-camera', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: '6ecc7c2e-4bea-4218-b25b-98ee0f9b51ba',
    connected: true,
    enhanced: true
  })
}).then(r => r.json()).then(console.log);
```

## Expected Fix Results

### Before Fix:
- ❌ "Session ID is missing" errors
- ❌ "Session ID is literally 'null'" errors  
- ❌ Mobile shows connecting but never progresses
- ❌ Desktop doesn't detect connection

### After Fix:
- ✅ Clean session ID detection from URL
- ✅ Proper connection status requests
- ✅ Mobile connects and stays connected
- ✅ Desktop detects connection and shows video

## Next Steps

1. **Scan QR code** and check mobile console for the debug messages
2. **Verify session ID** is properly extracted from URL
3. **Check server logs** for successful connection messages
4. **Test desktop detection** - should transition from QR to video view

If session ID is still null, the issue is in QR code generation. If session ID is detected but connection fails, the issue is in the API request format.
