# Fixing WebSocket Certificate Issues

If you're seeing WebSocket connection errors related to certificate validation, follow these steps to fix the issue:

## Understanding the Problem

WebSocket connections use the same certificate validation as regular HTTPS connections. When using self-signed certificates for development, your browser needs to explicitly trust these certificates before WebSocket connections will work.

## How to Fix the Issue

### Step 1: Accept the Frontend Certificate

1. Visit the frontend URL in your browser: `https://localhost:3000`
2. Accept the certificate warning (varies by browser)

### Step 2: Accept the AI Service Certificate

1. Visit the AI service health endpoint: `https://127.0.0.1:8000/health`
2. Accept the certificate warning for this domain as well

### Step 3: Test the WebSocket Connection

After accepting both certificates, test the WebSocket connection:
- Visit: `https://localhost:3000/test-websocket.html`
- Click the "Test Connection" button

### Step 4: Return to the Application

Now you can return to the application and the WebSocket connection should work.

## Browser-Specific Instructions

### Chrome
1. Click "Advanced"
2. Click "Proceed to site (unsafe)"

### Firefox
1. Click "Advanced..."
2. Click "Accept the Risk and Continue"

### Safari
1. Click "Show Details"
2. Click "visit this website"
3. Click "Visit Website" in the popup

## Why This Works

WebSocket connections use the same certificate validation as regular HTTPS connections. By manually accepting the certificates for both services, you're telling your browser to trust them for all connection types, including WebSockets.

This is only needed for development with self-signed certificates. In production, you would use properly signed certificates from a trusted certificate authority.
