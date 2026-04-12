'use client'
import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface HasPermissionProps {
    permission?: string;
    anyOf?: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * 🧱 Authorization Wrapper Component
 * Conditionally renders children if user has required permissions.
 */
export default function HasPermission({ 
    permission, 
    anyOf, 
    children, 
    fallback = null 
}: HasPermissionProps) {
    const { hasPermission, hasAnyPermission } = usePermission();

    let isAuthorized = false;

    if (permission) {
        isAuthorized = hasPermission(permission);
    } else if (anyOf) {
        isAuthorized = hasAnyPermission(anyOf);
    } else {
        // If no permission specified, treat as authorized (or handle as error)
        isAuthorized = true;
    }

    if (!isAuthorized) return <>{fallback}</>;

    return <>{children}</>;
}
