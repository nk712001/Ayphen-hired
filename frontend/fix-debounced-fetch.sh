#!/bin/bash

# Create a backup of the original file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak4

# Find the line number where the debouncedFetch function starts
START_LINE=$(grep -n "\[backoffDelay\]" components/setup/ThirdCameraSetup.tsx | cut -d':' -f1)
END_LINE=$((START_LINE - 50))

# Extract the function signature
SIGNATURE=$(sed -n "${END_LINE},${END_LINE}p" components/setup/ThirdCameraSetup.tsx)

# Check if we found the function signature
if [[ $SIGNATURE != *"debouncedFetch"* ]]; then
  echo "Could not find debouncedFetch function signature"
  exit 1
fi

# Replace the function with a fixed version
cat > fixed-function.txt << 'EOT'
  // Debounced fetch function with exponential backoff
  const debouncedFetch = useCallback(async (url: string, options?: RequestInit, maxRetries = 3) => {
    const apiKey = url.split('?')[0]; // Use the base URL as the key
    
    // Initialize or increment attempt counter
    if (!apiCallAttemptsRef.current[apiKey]) {
      apiCallAttemptsRef.current[apiKey] = 0;
    }
    
    const currentAttempt = apiCallAttemptsRef.current[apiKey];
    
    // If we've exceeded max retries, wait longer before trying again
    if (currentAttempt > maxRetries) {
      const delay = backoffDelay(currentAttempt, 2000, 30000);
      console.log(`Too many attempts for ${apiKey}, waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    try {
      // Add a small random delay to prevent exact simultaneous requests
      const jitter = Math.floor(Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, jitter));
      
      apiCallAttemptsRef.current[apiKey]++;
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay(currentAttempt);
        
        console.log(`Rate limited (429) for ${apiKey}, retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return debouncedFetch(url, options, maxRetries); // Retry
      }
      
      // Success - reset counter
      if (response.ok) {
        apiCallAttemptsRef.current[apiKey] = 0;
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching ${apiKey}:`, error);
      
      // Network error - backoff and retry if we haven't exceeded max retries
      if (currentAttempt <= maxRetries) {
        const delay = backoffDelay(currentAttempt);
        console.log(`Network error for ${apiKey}, retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return debouncedFetch(url, options, maxRetries); // Retry
      }
      
      throw error; // Re-throw if we've exceeded max retries
    }
  }, [backoffDelay]);
EOT

# Find the start and end lines of the debouncedFetch function
START_LINE=$(grep -n "const debouncedFetch" components/setup/ThirdCameraSetup.tsx | cut -d':' -f1 || echo "")

if [ -z "$START_LINE" ]; then
  # If we can't find the function, look for the line before the backoffDelay dependency
  START_LINE=$(($(grep -n "\[backoffDelay\]" components/setup/ThirdCameraSetup.tsx | cut -d':' -f1) - 50))
fi

END_LINE=$(grep -n "\[backoffDelay\]" components/setup/ThirdCameraSetup.tsx | cut -d':' -f1)

# Create a temporary file with the fixed function
sed -i '' "${START_LINE},${END_LINE}c\\
$(cat fixed-function.txt)" components/setup/ThirdCameraSetup.tsx

# Clean up
rm fixed-function.txt

echo "Fixed debouncedFetch function in ThirdCameraSetup.tsx"
