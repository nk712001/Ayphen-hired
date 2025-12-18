'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, ArrowRight, Info, AlertCircle, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'USER', // Default to USER for test access
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL parameters
  const testLink = searchParams?.get('testLink') || '';
  const message = searchParams?.get('message') || '';
  const emailParam = searchParams?.get('email') || '';
  const nameParam = searchParams?.get('name') || '';

  useEffect(() => {
    // If coming from a test link, set role to USER (student/candidate) and pre-fill fields
    if (testLink) {
      setFormData(prev => ({
        ...prev,
        role: 'USER',
        email: emailParam || prev.email,
        fullName: nameParam || prev.fullName
      }));
    }
  }, [testLink, emailParam, nameParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setError('An account with this email already exists. Please use a different email or sign in.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        return;
      }
      // Registration successful
      if (testLink) {
        // Sign in the user automatically after registration
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (signInResult?.ok) {
          // Redirect to test start page after successful sign-in
          router.push(`/assess/${testLink}`);
        } else {
          // If auto sign-in fails, redirect to login with test link
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/assess/${testLink}`)}&email=${encodeURIComponent(formData.email)}`);
        }
      } else {
        // Use the redirect URL from the response
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-4xl">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left side - Welcome section */}
            <div className="relative bg-gradient-to-br from-primary via-primary-400 to-secondary p-8 flex flex-col justify-center text-white overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-md animate-ping" style={{ animationDelay: '2s' }}></div>
              </div>

              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="relative z-10">
                <div className="mb-8">
                  {/* Modern logo container */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full animate-pulse"></div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                      Welcome to
                    </h1>
                    <h2 className="text-3xl font-bold text-white">
                      Ayphen Platform
                    </h2>
                  </div>

                  <p className="text-white/90 text-lg leading-relaxed font-light">
                    Join thousands of professionals using our cutting-edge platform for seamless collaboration and innovation.
                  </p>
                </div>

                {/* Modern feature cards */}
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-white/90 font-medium">Enterprise-grade security</span>
                  </div>

                  <div className="flex items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-white/90 font-medium">AI-powered insights</span>
                  </div>

                  <div className="flex items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-white/90 font-medium">Real-time collaboration</span>
                  </div>
                </div>

                {/* Stats section */}
                <div className="mt-8 pt-6 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">10K+</div>
                      <div className="text-white/70 text-sm">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">99.9%</div>
                      <div className="text-white/70 text-sm">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-8 flex flex-col justify-center min-h-full">

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Fill in your details to get started</p>
              </div>

              {message && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">{message}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={!!testLink}
                        className={`w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white ${testLink ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        required
                      >
                        <option value="USER">User</option>
                        <option value="INTERVIEWER">Interviewer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        placeholder="••••••••"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I agree to the <a href="#" className="text-primary hover:text-primary-400">Terms</a> and <a href="#" className="text-primary hover:text-primary-400">Privacy Policy</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-primary to-primary-400 text-white font-semibold rounded-xl hover:from-primary-dark hover:to-primary-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-medium text-primary hover:text-primary-400">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
