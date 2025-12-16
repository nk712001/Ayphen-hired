# Complete Guide to Fixing WebSocket Connection Issues

This guide provides step-by-step instructions to fix WebSocket connection issues in the Ayphen Hire application.

## Common Error Messages

If you're seeing any of these errors, this guide will help you:

```
WebSocket connection failed: The certificate for this server is invalid.
WebSocket error: Event {isTrusted: true, type: "error", target: WebSocket, …}
This error may be due to mixed content restrictions.
The browser is blocking non-secure WebSocket (ws://) connections from a secure context (https://).
```

## Step 1: Ensure Both Services Are Running with HTTPS

### Check if the AI service is running:

```bash
curl -k https://127.0.0.1:8000/health
```

If this returns `{"status":"healthy"}`, the AI service is running with HTTPS.

If not, start the AI service with HTTPS:

```bash
./restart-ai-service.sh
```

## Step 2: Accept the Self-Signed Certificates

WebSocket connections use the same certificate validation as regular HTTPS connections. You need to manually accept the certificates for both services:

1. Visit the frontend URL: `https://localhost:3000`
2. Accept the certificate warning in your browser
3. Visit the AI service health endpoint: `https://127.0.0.1:8000/health`
4. Accept the certificate warning for this domain as well

## Step 3: Use IP Address Instead of Hostname

Browsers handle certificate validation differently for IP addresses vs. hostnames. Using `127.0.0.1` instead of `localhost` can help bypass certain certificate validation issues:

- In your code, replace all instances of `localhost` with `127.0.0.1`
- Update environment variables to use `https://127.0.0.1:8000` instead of `https://localhost:8000`

## Step 4: Test the WebSocket Connection

After completing the above steps, test your WebSocket connection:

1. Visit: `https://localhost:3000/direct-test.html`
2. Try the different test buttons to see which connection method works

## Step 5: Verify WebSocket URL Construction

Ensure your WebSocket URL is constructed correctly:

1. For HTTPS frontend: Use `wss://127.0.0.1:8000/ws/proctor/your-session-id`
2. For HTTP frontend: Use `ws://127.0.0.1:8000/ws/proctor/your-session-id`

## Troubleshooting Specific Issues

### Certificate Validation Errors

If you see errors about invalid certificates:

1. Make sure you've visited and accepted the certificate at `https://127.0.0.1:8000/health`
2. Try using the IP address (`127.0.0.1`) instead of `localhost`
3. Check that your certificates in the `/certs` directory are valid

### Mixed Content Errors

If you see errors about mixed content:

1. Ensure both frontend and AI service are using the same protocol (both HTTP or both HTTPS)
2. If frontend is HTTPS, the WebSocket connection must use WSS (secure WebSocket)
3. Check that the WebSocket URL is constructed correctly based on the page protocol

### Connection Refused Errors

If you see connection refused errors:

1. Verify the AI service is running: `curl -k https://127.0.0.1:8000/health`
2. Check if the port is correct (default is 8000)
3. Ensure no firewall is blocking the connection

## Development vs. Production

- For development: Use self-signed certificates and follow the steps above
- For production: Use properly signed certificates from a trusted certificate authority

## Need More Help?

If you're still experiencing issues:
1. Try the advanced test page: `https://localhost:3000/direct-test.html`
2. Check the browser console for specific error messages
3. Restart both services using the provided scripts
