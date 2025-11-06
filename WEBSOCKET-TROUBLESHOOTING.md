# WebSocket Connection Troubleshooting Guide

This guide helps you troubleshoot and fix WebSocket connection issues in the Ayphen Hire application, particularly when encountering mixed content errors or certificate validation issues.

## Understanding the Issues

You might encounter one of two common issues:

### 1. Mixed Content Error

This error occurs when your frontend is running on HTTPS but trying to connect to a WebSocket server using an insecure ws:// protocol:

```
WebSocket error: Event {isTrusted: true, type: "error", target: WebSocket, …}
This error may be due to mixed content restrictions.
The browser is blocking non-secure WebSocket (ws://) connections from a secure context (https://).
```

This happens when:
- Your frontend is running on HTTPS (secure)
- But your WebSocket connection is trying to use WS:// (insecure)
- Modern browsers block insecure connections from secure contexts for security reasons

### 2. Certificate Validation Error

This error occurs when your browser rejects the self-signed certificate used for development:

```
WebSocket connection to 'wss://127.0.0.1:8000/ws/proctor/session_id' failed: 
The certificate for this server is invalid. You might be connecting to a server 
that is pretending to be "127.0.0.1" which could put your confidential information at risk.
```

This happens when:
- Both frontend and AI service are using HTTPS with self-signed certificates
- The browser hasn't been told to trust these certificates
- WebSocket connections use the same certificate validation as regular HTTPS connections

## Solution Options

### Option 1: Run Both Services with HTTPS (Recommended)

This is the most secure and reliable approach:

1. Start both services with HTTPS using the provided script:

```bash
./start-secure-servers.sh
```

This script:
- Verifies SSL certificates exist in the `/certs` directory
- Starts the AI service with HTTPS enabled
- Starts the Next.js frontend with HTTPS enabled

### Option 2: Run the AI Service with HTTPS

If you want to start services separately:

1. Start the AI service with HTTPS:

```bash
cd ai_service
./start_secure.sh
```

2. Start the frontend with HTTPS:

```bash
cd frontend
npm run dev:secure
```

### Option 3: Run Both Services without HTTPS

For development only (not recommended for production):

1. Start the AI service without HTTPS:

```bash
cd ai_service
python main.py
```

2. Start the frontend without HTTPS:

```bash
cd frontend
npm run dev
```

## Accepting Self-Signed Certificates

If you're seeing certificate validation errors, you need to manually accept the self-signed certificates:

### Option 1: Use the Certificate Acceptance Helper

We've created a helper script to guide you through accepting the certificates:

```bash
./accept-certificates.sh
```

This will open a webpage with step-by-step instructions for accepting both certificates.

### Option 2: Manual Certificate Acceptance

1. Visit the frontend URL in your browser: `https://localhost:3000`
2. Accept the certificate warning (varies by browser)
3. Visit the AI service health endpoint: `https://127.0.0.1:8000/health`
4. Accept the certificate warning for this domain as well
5. Now try your WebSocket connection again

## Testing Your WebSocket Connection

We've provided a test script to verify your WebSocket connection:

1. Open your browser console (F12 or right-click > Inspect > Console)
2. Visit the test page: `https://localhost:3000/test-websocket.html`

Or include the test script in your HTML:

```html
<script src="/test-websocket-connection.js"></script>
```

## Common Issues and Solutions

### 1. Use IP Address Instead of Localhost

**IMPORTANT:** Always use the IP address `127.0.0.1` instead of `localhost` for WebSocket connections with self-signed certificates.

This is critical because:
- Browsers handle certificate validation differently for IP addresses vs. hostnames
- Using `127.0.0.1` can bypass certain certificate validation issues
- This applies to both the frontend configuration and WebSocket connections

To implement this:
- Update `next.config.mjs` to use `https://127.0.0.1:8000` instead of `https://localhost:8000`
- In `ProctorClient.ts`, replace all instances of `localhost` with `127.0.0.1`
- Use the provided `restart-services.sh` script to restart both services with the correct configuration

### 2. Certificate Warnings

Since we're using self-signed certificates for development:
- Click "Advanced" and then "Proceed to site" (Chrome)
- Click "Accept the Risk and Continue" (Firefox)
- For mobile devices, manually accept the certificate in browser settings

### 3. AI Service Not Running with HTTPS

If you see WebSocket errors while the frontend is on HTTPS:
- Verify the AI service is running with HTTPS (check for "SSL certificates loaded successfully" in the console)
- Ensure you're using `./start_secure.sh` or `./start-secure-servers.sh`

### 4. Incorrect Environment Variables

If you've customized your environment:
- Check that `NEXT_PUBLIC_AI_SERVICE_URL` in `next.config.mjs` uses the correct protocol
- For HTTPS frontend, this should be `https://127.0.0.1:8000`
- For HTTP frontend, this should be `http://127.0.0.1:8000`

### 5. Mobile Access Issues

For accessing from mobile devices:
- Use your local network IP instead of localhost
- Ensure both services use HTTPS
- Accept certificate warnings on the mobile device

## Need More Help?

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify both services are running on the expected protocols
3. Try clearing browser cache and cookies
4. Ensure no firewall is blocking WebSocket connections on ports 3000 or 8000
