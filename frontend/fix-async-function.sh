#!/bin/bash

# Create a backup of the original file
cp components/setup/ThirdCameraSetup.tsx components/setup/ThirdCameraSetup.tsx.bak3

# Fix the debouncedFetch function by adding the async keyword
sed -i '' 's/const debouncedFetch = useCallback((/const debouncedFetch = useCallback(async (/' components/setup/ThirdCameraSetup.tsx

echo "Fixed debouncedFetch function in ThirdCameraSetup.tsx by adding async keyword"
