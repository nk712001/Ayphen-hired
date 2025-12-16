'use client';

import { RoleSpecificLoginForm } from '@/components/auth/RoleSpecificLoginForm';

export default function AdminLoginPage() {
  return (
    <RoleSpecificLoginForm
      role="admin"
      title="Admin Portal"
      subtitle="Access the admin dashboard"
    />
  );
}
