'use native';
'use client';

import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    callbackUrl?: string;
}

export default function SignOutButton({
    className,
    callbackUrl = '/auth/login',
    children,
    ...props
}: SignOutButtonProps) {
    return (
        <button
            onClick={() => signOut({ callbackUrl })}
            className={cn("text-left", className)}
            {...props}
        >
            {children || "Sign Out"}
        </button>
    );
}
