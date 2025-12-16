'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, User, Mail, Phone, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
};

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Omit<UserProfile, 'id'>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.email) {
        setIsLoading(false);
        router.push(`/auth/login?callbackUrl=${encodeURIComponent('/profile/edit')}`);
        return;
      }

      try {
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch profile: ${response.status}`);
        }
        
        const data = await response.json();
        setFormData({
          name: data.name || session.user.name || '',
          email: data.email || session.user.email || '',
          phone: data.phone || '',
          role: data.role || 'User',
          avatar: data.avatar || session.user.image || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load profile data';
        toast.error(errorMessage);
        
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          router.push(`/auth/login?callbackUrl=${encodeURIComponent('/profile/edit')}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!formData.name?.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone?.trim() || null,
          avatar: formData.avatar?.trim() || null,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(
          responseData.error || 
          `Failed to update profile: ${response.status} ${response.statusText}`
        );
      }
      
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });
      
      // Show success message before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect back to profile page
      router.push('/profile');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error cases
        if (errorMessage.includes('Validation failed')) {
          errorMessage = 'Please check your input and try again.';
        }
      }
      
      toast.error('Update Failed', {
        description: errorMessage,
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your account information and settings.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role/Position</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="role"
                    name="role"
                    type="text"
                    value={formData.role}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Picture URL</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="url"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
                {formData.avatar && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <div className="h-20 w-20 rounded-full overflow-hidden border">
                      <img 
                        src={formData.avatar} 
                        alt="Profile preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
