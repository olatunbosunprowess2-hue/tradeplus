'use client';

import { useState, useEffect } from 'react';
import { offersApi } from '@/lib/offers-api';
import { useToastStore } from '@/lib/toast-store';

interface BrandSettings {
    requireDownpayment: boolean;
    downpaymentType: 'FIXED' | 'PERCENTAGE';
    downpaymentValue: number;
    defaultTimerDuration: number;
}

export default function TradePreferences() {
    const [settings, setSettings] = useState<BrandSettings>({
        requireDownpayment: false,
        downpaymentType: 'FIXED',
        downpaymentValue: 0,
        defaultTimerDuration: 60,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { addToast } = useToastStore();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await offersApi.getBrandSettings();
            if (data) {
                setSettings({
                    requireDownpayment: data.requireDownpayment ?? false,
                    downpaymentType: data.downpaymentType ?? 'FIXED',
                    downpaymentValue: data.downpaymentValue ?? 0,
                    defaultTimerDuration: data.defaultTimerDuration ?? 60,
                });
            }
        } catch {
            // If no settings exist yet, use defaults
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await offersApi.updateBrandSettings(settings);
            addToast('success', 'Trade preferences saved successfully!');
            setHasChanges(false);
        } catch (error: any) {
            addToast('error', error.response?.data?.message || 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const timerPresets = [
        { label: '30 min', value: 30 },
        { label: '1 hour', value: 60 },
        { label: '2 hours', value: 120 },
        { label: '6 hours', value: 360 },
        { label: '12 hours', value: 720 },
        { label: '24 hours', value: 1440 },
    ];

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="h-5 bg-gray-200 rounded w-40" />
                </div>
                <div className="px-6 py-6 space-y-4">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-10 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="font-bold text-gray-900">Trade Preferences</h2>
                </div>
                {hasChanges && (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                        Unsaved changes
                    </span>
                )}
            </div>

            <div className="px-6 py-5 space-y-6">
                {/* Anti-Ghosting Timer */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                        ⏰ Trade Timer Duration
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                        How long a buyer has to complete the trade after you accept their offer.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {timerPresets.map(preset => (
                            <button
                                key={preset.value}
                                onClick={() => updateField('defaultTimerDuration', preset.value)}
                                className={`
                                    px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                    ${settings.defaultTimerDuration === preset.value
                                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1'
                                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                    }
                                `}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Custom:</span>
                        <input
                            type="number"
                            value={settings.defaultTimerDuration}
                            onChange={e => updateField('defaultTimerDuration', Math.max(10, Math.min(1440, parseInt(e.target.value) || 10)))}
                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            min={10}
                            max={1440}
                        />
                        <span className="text-xs text-gray-500">minutes (10–1440)</span>
                    </div>
                    <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                        💡 This sets how long a buyer has to reply or pay after you accept their offer.
                        If they ghost you, the item is automatically released back to your store.
                    </p>
                </div>

                <hr className="border-gray-100" />

                {/* Downpayment Controls */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800">
                                💰 Require Downpayment
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Buyers must pay a deposit before the trade proceeds.
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                💡 Protect your time. Require a small commitment fee before reserving high-value items for buyers.
                            </p>
                        </div>
                        <button
                            onClick={() => updateField('requireDownpayment', !settings.requireDownpayment)}
                            className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                ${settings.requireDownpayment ? 'bg-blue-600' : 'bg-gray-300'}
                            `}
                        >
                            <span className={`
                                inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm
                                ${settings.requireDownpayment ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                        </button>
                    </div>

                    {settings.requireDownpayment && (
                        <div className="pl-4 border-l-2 border-blue-200 space-y-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateField('downpaymentType', 'FIXED')}
                                        className={`
                                            flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                            ${settings.downpaymentType === 'FIXED'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        💵 Fixed Amount
                                    </button>
                                    <button
                                        onClick={() => updateField('downpaymentType', 'PERCENTAGE')}
                                        className={`
                                            flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                            ${settings.downpaymentType === 'PERCENTAGE'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        📊 Percentage
                                    </button>
                                </div>
                            </div>

                            {/* Value Input */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    {settings.downpaymentType === 'FIXED' ? 'Amount (in kobo/cents)' : 'Percentage (max 50%)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={settings.downpaymentValue}
                                        onChange={e => {
                                            const max = settings.downpaymentType === 'PERCENTAGE' ? 50 : 100000000;
                                            updateField('downpaymentValue', Math.max(0, Math.min(max, parseInt(e.target.value) || 0)));
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        min={0}
                                        max={settings.downpaymentType === 'PERCENTAGE' ? 50 : undefined}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                        {settings.downpaymentType === 'PERCENTAGE' ? '%' : 'kobo'}
                                    </span>
                                </div>
                                {settings.downpaymentType === 'FIXED' && settings.downpaymentValue > 0 && (
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        = ₦{(settings.downpaymentValue / 100).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Saving...
                            </>
                        ) : (
                            'Save Trade Preferences'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
