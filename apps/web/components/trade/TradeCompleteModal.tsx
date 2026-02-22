import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500 overflow-hidden relative">

                {/* Confetti / Celebration Background Effect */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[-10%] left-[20%] w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 mb-6 animate-bounce-[1s_ease-in-out_infinite]">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Congratulations!</h2>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                        Your trade for <span className="font-bold text-gray-900">{targetListingTitle}</span> was successfully completed with {otherPartyName}.
                    </p>

                    {targetListingImage && (
                        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md mb-8 ring-4 ring-gray-50">
                            <img
                                src={targetListingImage}
                                alt={targetListingTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="w-full space-y-3">
                        <Link
                            href={`/orders/${tradeId}/review`}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Leave a Review
                        </Link>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            Return to Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
