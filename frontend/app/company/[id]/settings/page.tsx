'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Building2, Mail, Shield, Palette, Database } from 'lucide-react';

export default function CompanySettingsPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState({
    name: '',
    domain: '',
    emailDomain: '',
    ssoEnabled: false,
    customBranding: false,
    aiProctoringLevel: 'standard',
    logoUrl: '',
    primaryColor: '#3B82F6'
  });

  useEffect(() => {
    fetch(`/api/company/${companyId}`)
      .then(res => res.json())
      .then(data => {
        setCompany(data.company);
        setSettings({
          name: data.company?.name || '',
          domain: data.company?.domain || '',
          emailDomain: data.company?.companySettings?.emailDomain || '',
          ssoEnabled: data.company?.companySettings?.ssoEnabled || false,
          customBranding: data.company?.companySettings?.customBranding || false,
          aiProctoringLevel: data.company?.companySettings?.aiProctoringLevel || 'standard',
          logoUrl: data.company?.companySettings?.logoUrl || '',
          primaryColor: data.company?.companySettings?.primaryColor || '#3B82F6'
        });
      });
  }, [companyId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);
    formData.append('companyId', companyId);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSettings({ ...settings, logoUrl: data.logoUrl });
        alert('Logo uploaded successfully!');
      } else {
        const errorMessage = data.details || data.error || 'Failed to upload logo';
        alert(`Upload failed: ${errorMessage}`);
        console.error('Logo upload error:', data);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Network error: Failed to upload logo. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/company/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('Settings saved successfully!');
        // Reload the page to apply branding changes
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to save settings: ${error.details || error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Company Settings</h2>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center mb-4">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">Company Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input
                type="text"
                value={settings.domain}
                onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">Email Configuration</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Domain</label>
            <input
              type="text"
              value={settings.emailDomain}
              onChange={(e) => setSettings({ ...settings, emailDomain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="company.com"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold">Security Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Single Sign-On (SSO)</label>
                <p className="text-xs text-gray-500">Enable SSO authentication</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ssoEnabled}
                onChange={(e) => setSettings({ ...settings, ssoEnabled: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Proctoring Level</label>
              <select
                value={settings.aiProctoringLevel}
                onChange={(e) => setSettings({ ...settings, aiProctoringLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center mb-4">
            <Palette className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="text-lg font-semibold">Branding</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Custom Branding</label>
                <p className="text-xs text-gray-500">Enable custom company branding</p>
              </div>
              <input
                type="checkbox"
                checked={settings.customBranding}
                onChange={(e) => setSettings({ ...settings, customBranding: e.target.checked })}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
            {settings.customBranding && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="mt-2 h-16 w-auto" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={settings.primaryColor || '#3B82F6'}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}