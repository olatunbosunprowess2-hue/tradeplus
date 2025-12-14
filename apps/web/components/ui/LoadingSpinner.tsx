'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'white' | 'gray';
    className?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-3',
};

const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
};

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }: LoadingSpinnerProps) {
    return (
        <div
            className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-label="Loading"
        />
    );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    children: React.ReactNode;
}

export function LoadingButton({
    isLoading = false,
    loadingText,
    children,
    disabled,
    className = '',
    ...props
}: LoadingButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || isLoading}
            className={`relative ${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
        >
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size="sm" color="white" />
                </span>
            )}
            <span className={isLoading ? 'opacity-0' : ''}>
                {isLoading && loadingText ? loadingText : children}
            </span>
        </button>
    );
}

interface FullPageLoaderProps {
    message?: string;
}

export function FullPageLoader({ message = 'Loading...' }: FullPageLoaderProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <LoadingSpinner size="xl" />
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
    );
}

export function InlineLoader({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center py-4 ${className}`}>
            <LoadingSpinner size="md" />
        </div>
    );
}
