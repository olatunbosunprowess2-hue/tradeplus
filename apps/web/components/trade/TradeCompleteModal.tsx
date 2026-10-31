'use client';

import React from 'react';
import Link from 'next/link';

interface TradeCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeId: string;
    targetListingTitle: string;
    targetListingImage?: string;
    otherPartyName: string;
}

export default function TradeCompleteModal({
    isOpen,
    onClose,
    tradeId,
    targetListingTitle,
    targetListingImage,
    otherPartyName
}: TradeCompleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[10050] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500 overflow-hidden relative border border-slate-200">

                <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase tracking-wider mb-2">
                        TRADE COMPLETED
                    </span>

                    <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Congratulations!</h2>
                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                        Your exchange for <span className="font-bold text-[#0F172A]">{targetListingTitle}</span> was successfully verified with {otherPartyName}.
                    </p>

                    {targetListingImage && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden shadow-sm mb-5 border border-slate-200">
                            <img
                                src={targetListingImage}
                                alt={targetListingTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="w-full space-y-2">
                        <Link
                            href={`/orders/${tradeId}/review`}
                            className="w-full py-3 bg-[#1D4ED8] text-white rounded-md font-bold uppercase tracking-wider text-xs hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>Leave a Review</span>
                        </Link>

                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-md font-bold uppercase tracking-wider text-[11px] transition-colors border border-slate-200"
                        >
                            Return to Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
