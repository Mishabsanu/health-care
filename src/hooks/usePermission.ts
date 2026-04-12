import { usePCMSStore } from '@/store/useStore';

/**
 * 🔐 Clinical Authorization Hook (Fully Dynamic)
 * Provides granular permission checking for UI elements without hardcoded role names.
 */
export const usePermission = () => {
    const { user } = usePCMSStore();

    /**
     * Check if user has a specific permission string
     * Users with 'allAccess' flag always return true.
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.allAccess) return true;
        return user.permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the provided permissions
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        if (user.allAccess) return true;
        return permissions.some(p => user.permissions.includes(p));
    };

    /**
     * Check if user is authorized to OPERATE (Edit/Delete) on a specific record.
     * @param record The data record containing 'createdBy' info.
     * @param permission Optional granular permission required for the action.
     */
    const canOperate = (record: any, permission?: string): boolean => {
        if (!user) return false;
        
        // 1. Mandatory base permission check (if provided)
        if (permission && !hasPermission(permission)) return false;

        // 2. AllAccess (Owner/Manager level) bypasses ownership rules
        if (user.allAccess) return true;

        // 3. Ownership-based access: Compare record creator ID with current user ID
        const creatorId = typeof record.createdBy === 'string' 
            ? record.createdBy 
            : record.createdBy?._id;
            
        return creatorId === user.id;
    };

    return {
        user,
        hasPermission,
        hasAnyPermission,
        canOperate,
        isMaster: user?.allAccess === true,
        isGuest: !user
    };
};
