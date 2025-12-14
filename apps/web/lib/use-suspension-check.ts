import { useState, useCallback } from 'react';
import { useAuthStore } from './auth-store';

/**
 * Hook to check if the current user is suspended and handle the modal display
 * Returns a function that checks suspension and shows modal if suspended
 */
export function useSuspensionCheck() {
    const { user } = useAuthStore();
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [attemptedAction, setAttemptedAction] = useState('');

    const isSuspended = user?.status === 'suspended';

    /**
     * Check if user can perform an action
     * If suspended, shows modal and returns false
     * If not suspended, returns true
     */
    const checkCanPerformAction = useCallback((actionDescription: string = 'perform this action'): boolean => {
        if (isSuspended) {
            setAttemptedAction(actionDescription);
            setShowSuspendedModal(true);
            return false;
        }
        return true;
    }, [isSuspended]);

    const closeModal = useCallback(() => {
        setShowSuspendedModal(false);
        setAttemptedAction('');
    }, []);

    return {
        isSuspended,
        showSuspendedModal,
        attemptedAction,
        checkCanPerformAction,
        closeModal,
    };
}
