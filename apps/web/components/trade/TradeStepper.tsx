import React from 'react';

interface TradeStepperProps {
    status: string;
    isBuyerLocked?: boolean;
    isSellerLocked?: boolean;
}

export default function TradeStepper({ status, isBuyerLocked, isSellerLocked }: TradeStepperProps) {
    const steps = [
        { id: 'accepted', label: 'Accepted' },
        { id: 'commitment', label: 'Locked' },
        { id: 'fulfillment', label: 'Exchange' },
        { id: 'completed', label: 'Done' }
    ];

    let currentStep = 0;

    if (status === 'accepted') {
        currentStep = 1;
        if (isBuyerLocked || isSellerLocked) {
            currentStep = 1.5;
        }
    } else if (status === 'awaiting_fulfillment') {
        currentStep = 3;
    } else if (status === 'completed') {
        currentStep = 4;
    } else if (status === 'disputed') {
        currentStep = 3;
    }

    const isDisputed = status === 'disputed';

    return (
        <div className="w-full py-1">
            <div className="flex items-center gap-0">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber || (currentStep === 4 && stepNumber === 4);
                    const isCurrent = Math.floor(currentStep) === stepNumber;
                    const isDisputedStep = isDisputed && stepNumber === 3;

                    return (
                        <React.Fragment key={step.id}>
                            {index > 0 && (
                                <div className={`flex-1 h-[2px] transition-all duration-500 ${
                                    isCompleted || (isCurrent && index < Math.floor(currentStep))
                                        ? isDisputed ? 'bg-red-500' : 'bg-[#1D4ED8]'
                                        : 'bg-slate-200'
                                }`} />
                            )}

                            <div className="flex flex-col items-center relative">
                                {/* Sharp rectangular step indicator — no rounded-full */}
                                <div className={`
                                    w-7 h-7 rounded flex items-center justify-center text-[11px] font-black transition-all duration-500
                                    ${isDisputedStep
                                        ? 'bg-red-100 border-2 border-red-500 text-red-700'
                                        : isCompleted
                                            ? 'bg-[#1D4ED8] border-2 border-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(29,78,216,0.35)]'
                                            : isCurrent
                                                ? 'bg-white border-2 border-[#2563EB] text-[#1D4ED8] shadow-[0_2px_8px_rgba(37,99,235,0.15)]'
                                                : 'bg-slate-100 border-2 border-slate-200 text-slate-400'
                                    }
                                `}>
                                    {isDisputedStep ? '!' : isCompleted ? (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : stepNumber}
                                </div>
                                <span className={`
                                    text-[9px] font-bold mt-1 whitespace-nowrap uppercase tracking-wide
                                    ${isDisputedStep
                                        ? 'text-red-600'
                                        : isCompleted
                                            ? 'text-[#1D4ED8]'
                                            : isCurrent
                                                ? 'text-[#2563EB]'
                                                : 'text-slate-400'
                                    }
                                `}>
                                    {isDisputedStep ? 'Dispute' : step.label}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {isDisputed && (
                <div className="mt-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-center">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">Trade Frozen — Admin Review</p>
                </div>
            )}
        </div>
    );
}
