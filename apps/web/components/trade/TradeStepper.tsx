import React from 'react';

interface TradeStepperProps {
    status: string; // 'pending', 'accepted', 'awaiting_fulfillment', 'completed', 'disputed'
    isBuyerLocked?: boolean;
    isSellerLocked?: boolean;
}

export default function TradeStepper({ status, isBuyerLocked, isSellerLocked }: TradeStepperProps) {
    const steps = [
        { id: 'accepted', label: 'Offer Accepted', icon: '🤝' },
        { id: 'commitment', label: 'Commitment', icon: '🔒' },
        { id: 'meetup', label: 'Meetup Phase', icon: '📍' },
        { id: 'completed', label: 'Fulfilled', icon: '✅' }
    ];

    // Determine current step index (1-based for visual progress)
    let currentStep = 0;

    if (status === 'accepted') {
        currentStep = 1;
        // If someone has started locking, we are visually transitioning to step 2
        if (isBuyerLocked || isSellerLocked) {
            currentStep = 1.5;
        }
    } else if (status === 'awaiting_fulfillment') {
        currentStep = 3; // Meaning Commitment is done, we are IN the Meetup Phase
    } else if (status === 'completed') {
        currentStep = 4;
    } else if (status === 'disputed') {
        currentStep = 3; // Frozen in meetup
    }

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Background Track */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />

                {/* Active Track */}
                <div
                    className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ${status === 'disputed' ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                    style={{ width: `${(Math.min(Math.floor(currentStep), 4) - 1) * 33.33}%` }}
                />

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber || (currentStep === 4 && stepNumber === 4);
                    const isCurrent = Math.floor(currentStep) === stepNumber;
                    const isDisputed = status === 'disputed' && stepNumber === 3;

                    let circleClass = "w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold border-2 transition-all duration-500 ";
                    let textClass = "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ";

                    if (isDisputed) {
                        circleClass += "bg-red-100 border-red-500 text-red-600 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                        textClass += "text-red-600";
                    } else if (isCompleted) {
                        circleClass += "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200";
                        textClass += "text-blue-900";
                    } else if (isCurrent) {
                        circleClass += "bg-white border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]";
                        textClass += "text-blue-600 font-black";
                    } else {
                        circleClass += "bg-white border-gray-200 text-gray-400";
                        textClass += "text-gray-400";
                    }

                    return (
                        <div key={step.id} className="relative flex flex-col items-center group">
                            <div className={circleClass}>
                                {isDisputed ? '🚨' : isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={textClass}>
                                {isDisputed ? 'DISPUTED' : step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {status === 'disputed' && (
                <div className="mt-10 p-3 bg-red-50 border border-red-200 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-bold text-red-700 uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Trade Frozen - Admin Review Pending
                    </p>
                </div>
            )}
        </div>
    );
}
