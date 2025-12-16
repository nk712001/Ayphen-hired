#!/bin/bash

echo "Applying fixes to the Ayphen Hire application..."

# 1. Update middleware.ts to allow more API endpoints
echo "Updating middleware.ts..."
cp middleware-update.ts middleware.ts

# 2. Update ThirdCameraSetup.tsx
echo "Creating backup of ThirdCameraSetup.tsx..."
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak

echo "Updating ThirdCameraSetup.tsx..."
# Add the checkVideoElement function and initialization code
sed -i '' '31a\
  // Function to safely check and get video element\
  const checkVideoElement = useCallback(() => {\
    if (!videoRef.current) {\
      console.error("Video ref is not available during checkVideoElement");\
      return null;\
    }\
    \
    // Ensure the video element is properly initialized\
    if (!videoRef.current.id) {\
      videoRef.current.id = "primary-camera-video";\
    }\
    \
    // Make sure the video element is visible\
    videoRef.current.style.display = "block";\
    \
    return videoRef.current;\
  }, []);\
\
  // Ref to track component mount state\
  const isMountedRef = useRef(true);\
  // Ref to track retry timeout\
  let retryTimeout: NodeJS.Timeout | null = null;\
\
  // Cleanup function\
  useEffect(() => {\
    return () => {\
      isMountedRef.current = false;\
      if (retryTimeout) {\
        clearTimeout(retryTimeout);\
      }\
    };\
  }, []);\
\
  // Initialize video element with a delay to ensure DOM is ready\
  useEffect(() => {\
    // Short delay to ensure DOM is ready\
    const initTimeout = setTimeout(() => {\
      const videoElement = checkVideoElement();\
      if (videoElement) {\
        console.log("Video element initialized successfully");\
        videoElement.style.display = "block";\
      }\
    }, 500);\
    \
    return () => clearTimeout(initTimeout);\
  }, [checkVideoElement]);' components/setup/ThirdCameraSetup.tsx

echo "Fixes applied successfully!"
echo "Please restart the frontend server to apply the changes."
