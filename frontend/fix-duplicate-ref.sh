#!/bin/bash

# Create a backup of the original file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak2

# Remove the duplicate isMountedRef declaration
# This removes lines 50-77 which contain the duplicate declaration and related code
sed -i '' '50,77d' components/setup/ThirdCameraSetup.tsx

echo "Fixed duplicate isMountedRef declaration in ThirdCameraSetup.tsx"
