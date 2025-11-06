# HTTPS Configuration for Ayphen Hire

This document provides instructions on how to use the HTTPS configuration with SSL certificates for the Ayphen Hire application.

## Overview

The application has been configured to use SSL certificates for secure HTTPS connections. This is essential for camera access on mobile devices, as most modern browsers require a secure context (HTTPS) for accessing camera and microphone APIs.

## Certificate Files

The SSL certificates are located in the `/certs` directory:
- `cert.pem`: The SSL certificate file
- `key.pem`: The private key file

## Starting the Servers with HTTPS

### 1. Test the SSL Certificates

Before starting the servers, you can test if the SSL certificates are valid:

```bash
node test-https.js
```

This will verify that the certificates are properly formatted and can be used for HTTPS.

### 2. Start the FastAPI AI Service with HTTPS

```bash
cd ai_service
python main.py
```

The FastAPI service will automatically detect the SSL certificates and start with HTTPS enabled.

### 3. Start the Next.js Frontend with HTTPS

```bash
cd frontend
npm run dev:secure
```

This will start the Next.js server using the custom HTTPS server configuration.

## Accessing the Application

Once both servers are running, you can access the application at:

```
https://localhost:3000
```

For mobile camera access, you'll need to use your local network IP address instead of localhost:

```
https://YOUR_LOCAL_IP:3000
```

## Troubleshooting

### Certificate Warnings

Since these are self-signed certificates, browsers will show a security warning. You can:
1. Click "Advanced" and then "Proceed to site" (Chrome)
2. Click "Accept the Risk and Continue" (Firefox)
3. For mobile devices, you may need to manually accept the certificate in your browser settings

### Mobile Camera Access

If you're having issues with mobile camera access:
1. Ensure you're accessing the site via HTTPS
2. Make sure you've accepted the certificate warning on your mobile device
3. Check that the QR code URL uses HTTPS and your local network IP (not localhost)

## Security Note

These certificates are for development purposes only. In a production environment, you should use properly signed certificates from a trusted certificate authority.
