#!/bin/bash

# Create a backup of the current file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak8

# Remove the second declaration of isMountedRef and its cleanup function
sed -i '' '/\/\/ Set isMountedRef to false when component unmounts/,+4d' components/setup/ThirdCameraSetup.tsx

echo "Removed duplicate isMountedRef declaration and cleanup"
