import React from 'react';

interface TradeStepperProps {
    status: string; // 'pending', 'accepted', 'awaiting_fulfillment', 'completed', 'disputed'
    isBuyerLocked?: boolean;
    isSellerLocked?: boolean;
}

export default function TradeStepper({ status, isBuyerLocked, isSellerLocked }: TradeStepperProps) {
    const steps = [
        { id: 'accepted', label: 'Accepted', icon: '✓' },
        { id: 'commitment', label: 'Locked', icon: '🔒' },
        { id: 'fulfillment', label: 'Exchange', icon: '🤝' },
        { id: 'completed', label: 'Done', icon: '🎉' }
    ];

    // Determine current step index (1-based for visual progress)
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
                            {/* Connector line (before each step except the first) */}
                            {index > 0 && (
                                <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                                    isCompleted || (isCurrent && index < Math.floor(currentStep))
                                        ? isDisputed ? 'bg-red-400' : 'bg-blue-500'
                                        : 'bg-gray-200'
                                }`} />
                            )}

                            {/* Step circle + label */}
                            <div className="flex flex-col items-center relative">
                                <div className={`
                                    w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-500
                                    ${isDisputedStep
                                        ? 'bg-red-100 border-2 border-red-400 text-red-600 animate-pulse'
                                        : isCompleted
                                            ? 'bg-blue-600 border-2 border-blue-600 text-white'
                                            : isCurrent
                                                ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-sm'
                                                : 'bg-gray-100 border-2 border-gray-200 text-gray-400'
                                    }
                                `}>
                                    {isDisputedStep ? '!' : isCompleted ? '✓' : <span className="text-[11px]">{step.icon}</span>}
                                </div>
                                <span className={`
                                    text-[9px] font-bold mt-1 whitespace-nowrap
                                    ${isDisputedStep
                                        ? 'text-red-600'
                                        : isCompleted
                                            ? 'text-blue-700'
                                            : isCurrent
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
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
                <div className="mt-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-red-700 flex items-center justify-center gap-1">
                        ⚠️ Trade Frozen — Admin Review
                    </p>
                </div>
            )}
        </div>
    );
}
