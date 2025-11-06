# Debug Mobile Streaming Issues

## Problem Analysis
The logs show that only heartbeats are being received, but no actual video frames are being processed. This suggests the mobile device is connecting but not streaming video data.

## Debug Changes Made

### 1. Added Comprehensive Logging
Added detailed logging to track the entire flow:

- **Page Load**: Confirms enhanced mobile page is loaded
- **Camera Initialization**: Tracks video element setup and metadata loading
- **Streaming Start**: Confirms when streaming begins
- **Frame Capture**: Logs each frame capture attempt and success/failure
- **Connection Status**: Tracks connection establishment

### 2. Added Safety Checks
- **Video Readiness**: Check `videoRef.current.readyState` before capture
- **Timeout Protection**: 5-second timeout for video metadata loading
- **Missing Elements**: Warn if video/canvas elements are missing

## What to Look For

### Expected Console Messages (Mobile Device)

**On Page Load:**
```
[Enhanced Mobile] Enhanced mobile camera page loaded
[Enhanced Mobile] Search params: sessionId=xxx&enhanced=true&fps=30
[Enhanced Mobile] Using session ID from URL: xxx
```

**On Camera Init:**
```
[Enhanced Mobile] Initializing camera with enhanced settings
[Enhanced Mobile] Video metadata loaded: {videoWidth: 640, videoHeight: 480, readyState: 4}
[Enhanced Mobile] Camera initialized successfully
```

**On Streaming Start:**
```
[Enhanced Mobile] Establishing automatic connection
[Enhanced Mobile] Starting enhanced 30 FPS streaming
[Enhanced Mobile] Connection status sent: true
[Enhanced Mobile] Streaming started at 30 FPS
```

**During Streaming:**
```
[Enhanced Mobile] Frame sent successfully: {frameCount: 1, latency: 45, enhanced: true}
[Enhanced Mobile] Frame sent successfully: {frameCount: 2, latency: 52, enhanced: true}
...
```

### Troubleshooting Steps

#### If No Page Load Messages:
- QR code might be pointing to wrong URL
- Check if mobile device can access the network
- Verify QR code contains `/mobile-camera-enhanced` path

#### If Camera Init Fails:
- Check HTTPS requirement for camera access
- Verify camera permissions on mobile device
- Look for `getUserMedia` errors

#### If Streaming Doesn't Start:
- Check if `sessionId` is properly set
- Look for "Streaming start skipped" messages
- Verify `autoConnected` state changes

#### If No Frames Are Sent:
- Look for "Frame capture skipped" warnings
- Check video `readyState` values
- Verify canvas element exists

## Quick Test Commands

### Check if Enhanced Page is Loading:
Open mobile browser console and look for:
```
[Enhanced Mobile] Enhanced mobile camera page loaded
```

### Check Session ID:
```javascript
// In mobile browser console
localStorage.getItem('mobileSessionId')
```

### Check Video Element Status:
```javascript
// In mobile browser console
const video = document.querySelector('video');
console.log({
  exists: !!video,
  readyState: video?.readyState,
  videoWidth: video?.videoWidth,
  videoHeight: video?.videoHeight,
  srcObject: !!video?.srcObject
});
```

### Force Start Streaming:
```javascript
// In mobile browser console (if auto-start fails)
document.querySelector('button').click(); // Click start streaming button
```

## Expected Server Logs

**When Mobile Connects:**
```
Mobile camera connection update for session xxx: connected
Updated connection for session: xxx
```

**When Frames Are Received:**
```
[Enhanced Mobile Frame] Received frame for session: xxx, enhanced: true, targetFPS: 30
[Enhanced Mobile Frame] Frame processed - Count: 1, FPS: 30.0, Latency: 45ms
```

## Next Steps

1. **Test the Enhanced Page**: Scan QR code and check mobile console
2. **Verify Camera Access**: Look for camera initialization messages
3. **Check Streaming**: Confirm frame sending messages appear
4. **Monitor Server**: Watch for frame processing logs

If issues persist, the debug logs will show exactly where the process is failing.
