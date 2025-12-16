#!/bin/bash

# Create a backup of the current file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak6

# Add the missing generateQRCode function
sed -i '' '/const \[networkIp, setNetworkIp\] = useState<string>(\x27\x27);/a\\
  \\
  // Generate QR code data\\
  const generateQRCode = useCallback(() => {\\
    const sessionId = generateSessionId();\\
    setMobileSessionId(sessionId);\\
    \\
    // Use IP address instead of localhost for better compatibility with mobile devices\\
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";\\
    \\
    // Use the specific system IP address 10.10.98.140 instead of dynamic detection\\
    // This ensures consistent QR code generation across all environments\\
    const host = "10.10.98.140";\\
    \\
    const port = window.location.port ? `:${window.location.port}` : "";\\
    \\
    // Add timestamp to prevent caching\\
    const timestamp = Date.now();\\
    const qrCodeUrl = `${protocol}//${host}${port}/mobile-camera?sessionId=${sessionId}&t=${timestamp}`;\\
    console.log("Generated QR Code URL:", qrCodeUrl);\\
    \\
    // Log additional debugging information\\
    console.log("QR Code generation details:", {\\
      protocol,\\
      host: "10.10.98.140", // Hardcoded IP address\\
      port,\\
      sessionId,\\
      fullUrl: qrCodeUrl,\\
      timestamp\\
    });\\
    \\
    return qrCodeUrl;\\
  }, [generateSessionId]);\\
' components/setup/ThirdCameraSetup.tsx

echo "Added missing generateQRCode function to ThirdCameraSetup.tsx"
