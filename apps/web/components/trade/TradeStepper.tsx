'use client';

import React from 'react';
import { Handshake, Lock, KeyRound, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TradeStepperProps {
    status: string;
    isBuyerLocked?: boolean;
    isSellerLocked?: boolean;
}

export default function TradeStepper({ status, isBuyerLocked, isSellerLocked }: TradeStepperProps) {
    const steps = [
        { id: 'accepted', label: 'Agreed', icon: Handshake },
        { id: 'commitment', label: 'Locked', icon: Lock },
        { id: 'fulfillment', label: 'Exchange', icon: KeyRound },
        { id: 'completed', label: 'Done', icon: ShieldCheck }
    ];

    let currentStep = 0;

    if (status === 'accepted') {
        currentStep = 1;
        if (isBuyerLocked && isSellerLocked) {
            currentStep = 2.5;
        } else if (isBuyerLocked || isSellerLocked) {
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
        <div className="w-full py-1.5 px-0.5 select-none">
            <div className="flex items-center justify-between relative">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber || (currentStep === 4 && stepNumber === 4);
                    const isCurrent = Math.floor(currentStep) === stepNumber;
                    const isPartiallyLocked = step.id === 'commitment' && currentStep === 1.5;
                    const isDisputedStep = isDisputed && stepNumber === 3;
                    const IconComponent = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Connecting Progress Track */}
                            {index > 0 && (
                                <div className="flex-1 mx-1.5 h-[3px] bg-slate-200/90 rounded-full overflow-hidden relative">
                                    <div
                                        className={`h-full transition-all duration-700 ease-out rounded-full ${
                                            isDisputed
                                                ? 'bg-rose-500'
                                                : isCompleted || (isCurrent && index < Math.floor(currentStep)) || isPartiallyLocked
                                                    ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                                                    : 'bg-transparent'
                                        }`}
                                        style={{
                                            width: isCompleted || (isCurrent && index < Math.floor(currentStep))
                                                ? '100%'
                                                : isPartiallyLocked && index === 1
                                                    ? '50%'
                                                    : '0%'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Step Node */}
                            <div className="flex flex-col items-center relative group shrink-0">
                                <div
                                    className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 relative
                                        ${isDisputedStep
                                            ? 'bg-rose-50 border-2 border-rose-500 text-rose-600 shadow-[0_2px_10px_rgba(244,63,94,0.3)] animate-pulse'
                                            : isCompleted
                                                ? 'bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] border border-[#1D4ED8] text-white shadow-[0_3px_12px_rgba(29,78,216,0.35)]'
                                                : isPartiallyLocked
                                                    ? 'bg-white border-2 border-amber-500 text-amber-600 shadow-[0_2px_10px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/20'
                                                    : isCurrent
                                                        ? 'bg-white border-2 border-[#2563EB] text-[#1D4ED8] shadow-[0_3px_12px_rgba(37,99,235,0.25)] ring-2 ring-[#2563EB]/20'
                                                        : 'bg-slate-50 border border-slate-200/90 text-slate-400'
                                        }
                                    `}
                                >
                                    {isDisputedStep ? (
                                        <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                                    ) : isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                    ) : (
                                        <IconComponent className={`w-3.5 h-3.5 ${isPartiallyLocked ? 'stroke-[2.5] animate-pulse' : 'stroke-[2]'}`} />
                                    )}

                                    {/* Active Pulse Ring */}
                                    {(isCurrent || isPartiallyLocked) && !isCompleted && !isDisputed && (
                                        <span className={`absolute -inset-1 rounded-lg border pointer-events-none animate-ping opacity-25 ${isPartiallyLocked ? 'border-amber-500' : 'border-[#2563EB]'}`} />
                                    )}
                                </div>

                                {/* Step Label */}
                                <span
                                    className={`
                                        text-[9px] font-black mt-1.5 uppercase tracking-wider whitespace-nowrap transition-colors
                                        ${isDisputedStep
                                            ? 'text-rose-600'
                                            : isCompleted
                                                ? 'text-[#1D4ED8]'
                                                : isPartiallyLocked
                                                    ? 'text-amber-600 font-extrabold'
                                                    : isCurrent
                                                        ? 'text-[#2563EB] font-extrabold'
                                                        : 'text-slate-400 font-bold'
                                        }
                                    `}
                                >
                                    {isDisputedStep
                                        ? 'Dispute'
                                        : isPartiallyLocked
                                            ? '1/2 Locked'
                                            : step.label
                                    }
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Disputed Alert Banner */}
            {isDisputed && (
                <div className="mt-2.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Trade Frozen — Admin Investigation Active</p>
                </div>
            )}
        </div>
    );
}
