# 🔄 Database Migration Required

## ⚠️ **Important: Prisma Migration Needed**

The `emailSent` field has been added to the `TestAssignment` model in the Prisma schema, but the database and Prisma client need to be updated.

## 📋 **Required Steps:**

### **1. Generate and Apply Migration**
```bash
# Generate migration for the new emailSent field
npx prisma migrate dev --name add-email-sent-to-test-assignment

# This will:
# - Create a new migration file
# - Add the emailSent column to the database
# - Regenerate the Prisma client with the new field
```

### **2. Alternative: Reset Database (Development Only)**
```bash
# If in development and data loss is acceptable
npx prisma migrate reset
npx prisma db push
```

### **3. Verify Migration**
```bash
# Check that the field was added
npx prisma studio
# Look at TestAssignment table - should see emailSent column
```

## 🎯 **What This Enables:**

After migration, the system will properly track:
- ✅ **Assignments with emails sent** during creation (`emailSent: true`)
- ✅ **Assignments without emails sent** during creation (`emailSent: false`)
- ✅ **Dashboard shows send email button** only for `emailSent: false` assignments

## 📊 **Current Implementation:**

### **Schema Change:**
```prisma
model TestAssignment {
  id            String    @id @default(cuid())
  testId        String
  candidateId   String
  uniqueLink    String    @unique
  status        String    @default("pending")
  emailSent     Boolean   @default(false)  // ← NEW FIELD
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  test          Test      @relation(fields: [testId], references: [id])
  candidate     User      @relation(fields: [candidateId], references: [id])
  proctorSessions ProctorSession[]
  answers       Answer[]
}
```

### **API Updates:**
- **Test assignment with email** - Sets `emailSent: true/false` based on actual email delivery
- **Dashboard API** - Returns `emailSent` status for each assignment
- **Send email API** - Updates `emailSent: true` after successful send

### **UI Behavior:**
- **Send Email Button** appears only when:
  - `emailSent: false`
  - `status: 'pending'`
  - Valid candidate email exists
- **Email Sent Badge** appears when `emailSent: true`

## 🚀 **After Migration:**

The dashboard will correctly show the "📧 Send Invitation" button only for candidates who were assigned tests **without** the email invitation checkbox checked during the assignment process.

**Run the migration to complete the email tracking feature!** 🎯
