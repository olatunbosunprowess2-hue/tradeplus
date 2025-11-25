import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    addToast: (type, message, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, type, message, duration };

        set((state) => ({
            toasts: [...state.toasts, toast],
        }));

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },

    success: (message) => {
        set((state) => {
            const id = Math.random().toString(36).substring(7);
            return {
                toasts: [...state.toasts, { id, type: 'success', message, duration: 3000 }],
            };
        });
    },

    error: (message) => {
        set((state) => {
            const id = Math.random().toString(36).substring(7);
            return {
                toasts: [...state.toasts, { id, type: 'error', message, duration: 4000 }],
            };
        });
    },

    info: (message) => {
        set((state) => {
            const id = Math.random().toString(36).substring(7);
            return {
                toasts: [...state.toasts, { id, type: 'info', message, duration: 3000 }],
            };
        });
    },

    warning: (message) => {
        set((state) => {
            const id = Math.random().toString(36).substring(7);
            return {
                toasts: [...state.toasts, { id, type: 'warning', message, duration: 3500 }],
            };
        });
    },
}));
