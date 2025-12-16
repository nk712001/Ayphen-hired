'use client';

import { useState } from 'react';
import { Settings, Save, Database, Mail, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Ayphen Hire',
    siteUrl: 'https://ayphen-hire.com',
    adminEmail: 'admin@ayphen.com',
    maxTestDuration: 180,
    allowRegistration: true,
    requireEmailVerification: true,
    enableProctoring: true,
    sessionTimeout: 30
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Globe className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
                  <input
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Test Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Test Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Test Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.maxTestDuration}
                    onChange={(e) => setSettings({...settings, maxTestDuration: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableProctoring"
                    checked={settings.enableProctoring}
                    onChange={(e) => setSettings({...settings, enableProctoring: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="enableProctoring" className="ml-2 block text-sm text-gray-900">
                    Enable Proctoring
                  </label>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={settings.allowRegistration}
                    onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="allowRegistration" className="ml-2 block text-sm text-gray-900">
                    Allow User Registration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-900">
                    Require Email Verification
                  </label>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Email Configuration</h2>
              </div>
              <div className="text-sm text-gray-600">
                <p>Email settings are configured via environment variables:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>SMTP_HOST</li>
                  <li>SMTP_PORT</li>
                  <li>SMTP_USER</li>
                  <li>SMTP_PASSWORD</li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}