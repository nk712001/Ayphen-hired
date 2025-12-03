#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")"

# Generate Prisma client in the frontend
cd frontend
npx prisma generate --schema=../prisma/schema.prisma

# Generate Prisma client in the backend (if needed)
# cd ../backend
# npx prisma generate

echo "Prisma client generated successfully!"
