#!/bin/bash

# Create a backup of our fixed file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.fixed

# Restore the original file
cp components/setup/ThirdCameraSetup.tsx.bak5 components/setup/ThirdCameraSetup.tsx

# Extract the fixed debouncedFetch function from our fixed file
sed -n '/const debouncedFetch/,/\}, \[backoffDelay\]\);/p' components/setup/ThirdCameraSetup.tsx.fixed > fixed-function.txt

# Find the approximate location of the debouncedFetch function in the original file
START_LINE=$(grep -n "apiCallAttemptsRef" components/setup/ThirdCameraSetup.tsx | head -1 | cut -d':' -f1)
if [ -z "$START_LINE" ]; then
  START_LINE=90
fi
END_LINE=$(grep -n "\[backoffDelay\]" components/setup/ThirdCameraSetup.tsx | head -1 | cut -d':' -f1)
if [ -z "$END_LINE" ]; then
  END_LINE=150
fi

# Create a temporary file with the original content up to the function
head -n $((START_LINE - 10)) components/setup/ThirdCameraSetup.tsx > temp1.txt

# Add our fixed function
cat fixed-function.txt >> temp1.txt

# Add the rest of the original content after the function
tail -n +$((END_LINE + 1)) components/setup/ThirdCameraSetup.tsx >> temp1.txt

# Replace the original file with our fixed version
mv temp1.txt components/setup/ThirdCameraSetup.tsx

# Clean up
rm fixed-function.txt

echo "Restored original content with fixed debouncedFetch function"
