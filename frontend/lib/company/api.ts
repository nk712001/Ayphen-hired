import { Company, CompanyUser, CompanyAnalytics } from './types';

export async function getCompany(companyId: string): Promise<Company | null> {
  const response = await fetch(`/api/company/${companyId}`);
  if (!response.ok) return null;
  return response.json();
}

export async function updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
  const response = await fetch(`/api/company/${companyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update company');
  return response.json();
}

export async function getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
  const response = await fetch(`/api/company/${companyId}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function inviteUser(companyId: string, email: string, role: string): Promise<void> {
  const response = await fetch(`/api/company/${companyId}/users/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) throw new Error('Failed to invite user');
}

export async function getCompanyAnalytics(companyId: string): Promise<CompanyAnalytics> {
  const response = await fetch(`/api/company/${companyId}/analytics`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}