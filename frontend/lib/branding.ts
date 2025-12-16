export interface BrandingConfig {
  logoUrl?: string;
  primaryColor?: string;
  customBranding?: boolean;
}

export function getBrandingConfig(companySettings?: any): BrandingConfig {
  if (!companySettings?.customBranding) {
    return {
      logoUrl: undefined,
      primaryColor: '#3B82F6',
      customBranding: false
    };
  }

  return {
    logoUrl: companySettings.logoUrl,
    primaryColor: companySettings.primaryColor || '#3B82F6',
    customBranding: true
  };
}

export function applyBranding(config: BrandingConfig) {
  if (!config.customBranding) return;

  const root = document.documentElement;
  if (config.primaryColor) {
    root.style.setProperty('--primary-color', config.primaryColor);
  }
}