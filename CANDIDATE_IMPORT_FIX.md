# Candidate Import Fix

## Issue Fixed
**Error**: `TypeError: Cannot read properties of undefined (reading 'findMany')`

**Root Cause**: The candidate import API was trying to use `prisma.candidate.findMany()` but there's no `candidate` model in the Prisma schema. Candidates are stored as `User` records with `role: 'student'`.

## Changes Made

### 1. **Updated Prisma Schema** (`/prisma/schema.prisma`)
- Added `resumeUrl String?` field to the User model
- This allows candidates to have resume URLs stored in their profile

```prisma
model User {
  // ... existing fields
  resumeUrl     String?   // Resume file URL for candidates
  // ... rest of fields
}
```

### 2. **Fixed Import API Route** (`/app/api/candidates/import/route.ts`)

#### Before (Broken):
```typescript
// Incorrect - no 'candidate' model exists
const existingCandidates = await (prisma as any).candidate.findMany({
  where: { email: { in: emails } }
});

const createdCandidates = await (prisma as any).candidate.createMany({
  data: newCandidates.map(candidate => ({
    name: candidate.name,
    email: candidate.email.toLowerCase().trim(),
    resumeUrl: candidate.resumeUrl
  }))
});
```

#### After (Fixed):
```typescript
// Correct - use User model with role filter
const existingCandidates = await prisma.user.findMany({
  where: {
    email: { in: emails },
    role: 'student'  // Candidates have role 'student'
  },
  select: { email: true }
});

const createdCandidates = await prisma.user.createMany({
  data: newCandidates.map(candidate => ({
    name: candidate.name,
    email: candidate.email.toLowerCase().trim(),
    role: 'student',  // Set role to 'student' for candidates
    resumeUrl: candidate.resumeUrl
  }))
});
```

### 3. **Fixed Type Handling**
- Updated email handling to account for nullable email fields from database
- Added proper filtering for null emails

```typescript
const existingEmails = new Set(
  existingCandidates
    .map((c: { email: string | null }) => c.email)
    .filter(Boolean)  // Remove null values
);
```

## Database Schema Update

The Prisma schema now includes the `resumeUrl` field in the User model:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  // ... other fields
  resumeUrl     String?   // NEW: Resume file URL for candidates
  role          String    @default("USER") // "USER", "ADMIN", "INTERVIEWER", "student"
  // ... rest of fields
}
```

## How Candidates Work in the System

1. **Storage**: Candidates are stored as `User` records with `role: 'student'`
2. **Identification**: Filtered by `role: 'student'` in queries
3. **Resume URLs**: Stored in the `resumeUrl` field of the User model
4. **Relationships**: Connected to tests via `TestAssignment` model

## API Usage

### Import Candidates
```bash
POST /api/candidates/import
Content-Type: application/json

{
  "candidates": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "resumeUrl": "https://example.com/resume.pdf"
    }
  ]
}
```

### Response
```json
{
  "count": 1,
  "skipped": 0
}
```

## Testing

1. **Start the server**: `npm run dev`
2. **Login as interviewer**
3. **Navigate to candidates page**
4. **Try importing candidates** - should now work without errors

## Related Files Updated

- `/prisma/schema.prisma` - Added resumeUrl field
- `/app/api/candidates/import/route.ts` - Fixed model usage
- `/app/api/candidates/route.ts` - Already correctly uses User model

## Verification

The fix ensures:
- ✅ No more "Cannot read properties of undefined" errors
- ✅ Candidates are properly stored as User records with role 'student'
- ✅ Resume URLs are preserved during import
- ✅ Existing candidate detection works correctly
- ✅ Proper error handling for duplicate emails

The candidate import functionality should now work correctly!
