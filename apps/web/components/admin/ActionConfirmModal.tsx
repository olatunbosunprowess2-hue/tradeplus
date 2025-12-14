'use client';

import { useState } from 'react';

interface ActionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
    title: string;
    message: string;
    showInput?: boolean;
    inputPlaceholder?: string;
    inputLabel?: string;
    confirmText?: string;
    confirmColor?: 'red' | 'green' | 'blue' | 'yellow';
}

export default function ActionConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    showInput = false,
    inputPlaceholder = 'Enter reason...',
    inputLabel = 'Reason',
    confirmText = 'Confirm',
    confirmColor = 'blue'
}: ActionConfirmModalProps) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (showInput && !reason.trim()) return;

        setIsLoading(true);
        try {
            await onConfirm(reason);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getColorClass = () => {
        switch (confirmColor) {
            case 'red': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'green': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'yellow': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={!isLoading ? onClose : undefined}
                />

                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 mb-4">{message}</p>

                    {showInput && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {inputLabel} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={inputPlaceholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] text-gray-900 placeholder:text-gray-500 bg-white"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || (showInput && !reason.trim())}
                            className={`px-4 py-2 text-white rounded-lg transition-colors font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${getColorClass()}`}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
