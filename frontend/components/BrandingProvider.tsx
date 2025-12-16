
'use client';

import { useEffect } from 'react';

function hexToHSL(hex: string): string {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '222.2 47.4% 11.2%'; // Fallback

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Return in shadcn HSL format (deg saturation% lightness%)
    // Note: shadcn variables are usually space separated without commas
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

interface BrandingProviderProps {
    primaryColor?: string | null;
    enableCustomBranding?: boolean;
}

export function BrandingProvider({ primaryColor, enableCustomBranding = true }: BrandingProviderProps) {
    useEffect(() => {
        if (!enableCustomBranding || !primaryColor) return;

        const hsl = hexToHSL(primaryColor);
        const root = document.documentElement;

        // Set Primary
        root.style.setProperty('--primary', hsl);
        // Set Ring to match
        root.style.setProperty('--ring', hsl);

        // Optional: Calculate foreground contrast? 
        // For simplicity, we assume generic white foreground for vibrant colors, 
        // but if logo color is very light, text might be unreadable.
        // Keeping --primary-foreground as is (usually white in dark primary)

        return () => {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--ring');
        };
    }, [primaryColor, enableCustomBranding]);

    return null; // This component handles side-effects only
}
