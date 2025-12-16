#!/bin/bash

# Create a backup of the current file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak7

# Extract the JSX content from the original file
grep -A1000 "return (" components/setup/ThirdCameraSetup.tsx.original > jsx-content.txt

# Extract the function definitions from our fixed file
head -n -10 components/setup/ThirdCameraSetup.tsx > fixed-functions.txt

# Combine the fixed functions with the original JSX
cat fixed-functions.txt jsx-content.txt > components/setup/ThirdCameraSetup.tsx.new

# Replace the current file with our combined version
mv components/setup/ThirdCameraSetup.tsx.new components/setup/ThirdCameraSetup.tsx

# Clean up
rm jsx-content.txt fixed-functions.txt

echo "Restored JSX content in ThirdCameraSetup.tsx"
