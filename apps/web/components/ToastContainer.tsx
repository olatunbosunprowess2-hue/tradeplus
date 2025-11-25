'use client';

import { useEffect } from 'react';
import { useToastStore } from '@/lib/toast-store';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    const getToastStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
            case 'error':
                return 'bg-gradient-to-r from-red-400 to-red-600 text-white';
            case 'warning':
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 'info':
                return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
            default:
                return 'bg-gray-800 text-white';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return '';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    removeToast={removeToast}
                    getToastStyles={getToastStyles}
                    getIcon={getIcon}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, removeToast, getToastStyles, getIcon }: any) {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 2000);
        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    return (
        <div
            className={`${getToastStyles(toast.type)} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-side transition-all duration-500`}
        >
            <span className="text-xl font-bold">{getIcon(toast.type)}</span>
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="text-white hover:text-gray-200 transition"
            >
                ✕
            </button>
        </div>
    );
}
