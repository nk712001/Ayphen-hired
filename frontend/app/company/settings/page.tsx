'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

interface CompanySettings {
  id: string;
  name: string;
  domain: string | null;
  primaryColor: string | null;
  logo: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  settings: {
    emailDomain: string | null;
    customBranding: boolean;
  } | null;
}

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    emailDomain: '',
    primaryColor: '#de065d',
    logo: '',
    customBranding: true
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const loadingToast = toast({
      title: "Uploading...",
      description: "Please wait while we upload your logo.",
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setFormData(prev => ({ ...prev, logo: data.url }));

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/company/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      setFormData({
        name: data.name || '',
        emailDomain: data.settings?.emailDomain || '',
        primaryColor: data.primaryColor || '#de065d',
        logo: data.logo || '',
        customBranding: data.settings?.customBranding ?? true
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load company settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to update settings');

      toast({
        title: 'Success',
        description: 'Company settings updated successfully',
      });
      fetchSettings(); // Refresh
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6 pb-20">
      {/* Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="p-8 md:p-12 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Company Settings</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Manage your organization's profile, customize your candidate experience, and oversee your subscription.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Branding Section */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50/50 pb-6 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Save className="w-5 h-5" />
                  </div>
                  Brand Identity
                </CardTitle>
                <CardDescription>
                  Customize how your company appears to candidates and employees.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-medium">Company Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="h-12 text-lg bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="emailDomain" className="text-base font-medium">Domain Restriction</Label>
                    <Input
                      id="emailDomain"
                      placeholder="example.com"
                      value={formData.emailDomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailDomain: e.target.value }))}
                      className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">Optional: restrict signups to this email domain.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Brand Appearance</Label>
                  <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Logo Upload */}
                      <div className="space-y-3 flex-1">
                        <Label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Logo</Label>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center group">
                            {formData.logo ? (
                              <img
                                src={formData.logo}
                                alt="Logo"
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="text-gray-300">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block">
                              <span className="sr-only">Choose logo</span>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary/10 file:text-primary
                                      hover:file:bg-primary/20
                                      cursor-pointer
                                    "
                              />
                            </label>
                            <p className="text-xs text-gray-400 mt-2">JPG, PNG or SVG. Max 5MB.</p>
                          </div>
                        </div>
                      </div>

                      {/* Color Picker */}
                      <div className="space-y-3">
                        <Label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Primary Color</Label>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Input
                              type="color"
                              value={formData.primaryColor || '#000000'}
                              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                              className="w-16 h-16 p-1 rounded-xl cursor-pointer border-0 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-mono font-medium text-gray-700 bg-white border px-3 py-1 rounded-md">
                              {formData.primaryColor}
                            </div>
                            <p className="text-xs text-gray-400">Click swatch to edit</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-gray-900">Enable Custom Branding</Label>
                    <p className="text-sm text-gray-500">
                      Apply your brand color to candidate portals and admin interfaces.
                    </p>
                  </div>
                  <Switch
                    checked={formData.customBranding}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, customBranding: checked }))}
                  />
                </div>
              </CardContent>
              <CardContent className="border-t bg-gray-50/50 p-6 flex justify-end">
                <Button
                  size="lg"
                  type="submit"
                  disabled={isSaving}
                  className="min-w-[150px] font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column: Preview & Status */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle>Plan Status</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-500">Current Tier</span>
                <span className="px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  {settings?.subscriptionTier}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${settings?.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-bold text-gray-900 capitalize">
                    {settings?.subscriptionStatus}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Card */}
          <Card className="border-0 shadow-lg ring-1 ring-gray-200 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white -z-10" />
            <CardHeader>
              <CardTitle>Branding Preview</CardTitle>
              <CardDescription>How buttons will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <button
                  className="w-full px-4 py-3 rounded-lg text-white font-medium shadow-md transition-all transform hover:scale-[1.02]"
                  style={{ backgroundColor: formData.primaryColor || '#000' }}
                >
                  Primary Action
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg border-2 font-medium bg-white"
                  style={{ borderColor: formData.primaryColor || '#000', color: formData.primaryColor || '#000' }}
                >
                  Secondary Action
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}