export interface Company {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  branding?: CompanyBranding;
  settings?: CompanySettings;
  subscriptionTier: 'basic' | 'pro' | 'enterprise';
  maxUsers: number;
  maxTests: number;
  features?: CompanyFeatures;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  theme?: 'light' | 'dark';
}

export interface CompanySettings {
  emailDomain?: string;
  ssoEnabled: boolean;
  customBranding: boolean;
  aiProctoringLevel: 'basic' | 'standard' | 'advanced';
  dataRetention: number;
}

export interface CompanyFeatures {
  aiProctoring: boolean;
  customBranding: boolean;
  ssoIntegration: boolean;
  advancedAnalytics: boolean;
  bulkOperations: boolean;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyRole?: 'admin' | 'manager' | 'member';
  department?: string;
  createdAt: Date;
}

export interface CompanyAnalytics {
  totalUsers: number;
  activeTests: number;
  completedTests: number;
  averageScore: number;
  monthlyUsage: {
    month: string;
    tests: number;
    users: number;
  }[];
}