import { createContext, useContext } from 'react';

export interface BrandingContextType {
    logoUrl?: string;
    primaryColor?: string;
    customBranding: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
    primaryColor: '#3B82F6',
    customBranding: false
});

export const useBranding = () => useContext(BrandingContext);

export default BrandingContext;
