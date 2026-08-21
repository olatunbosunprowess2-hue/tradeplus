'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';
import { ShieldCheck, Check, Building2, UserCheck, Clock } from 'lucide-react';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function VerificationRequiredModal({
  isOpen,
  onClose,
}: VerificationRequiredModalProps) {
  const router = useRouter();
  const { user, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, refreshProfile]);

  if (!isOpen) return null;

  const isPending = user?.verificationStatus === 'PENDING';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Top Icon */}
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mx-auto mb-3.5">
          <ShieldCheck className="w-5 h-5" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-slate-900 text-center">
          {isPending ? 'Verification Under Review' : 'Identity Verification Required'}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 text-center leading-relaxed mt-1.5 mb-5">
          {isPending
            ? 'Your verification documents are currently being reviewed. You will be able to list items and trade once approved.'
            : 'To ensure a safe, scam-free marketplace for everyone, all users must verify their identity before creating listings or swap offers.'}
        </p>

        {/* Checklist: Why is this mandatory */}
        {!isPending && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-md p-3.5 mb-5">
            <p className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Why is this required?
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Prevents scams, fraudulent listings, and duplicate accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Ensures real Nigerian locations and verified trader identities</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Enables 100% escrow protection for your transactions</span>
              </li>
            </ul>
          </div>
        )}

        {/* Timeline for Pending State */}
        {isPending && (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-md p-3.5 mb-5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Expected Review Time</span>
            </div>
            <p className="text-xs text-emerald-800">
              Your account is being reviewed and will be activated within <strong>24 hours</strong>.
            </p>
          </div>
        )}

        {/* Verification Options */}
        {!isPending ? (
          <div className="space-y-3">
            {/* Individual Verification Card */}
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-400 rounded-md transition-all text-left shadow-2xs flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">Verify Identity</p>
                  <p className="text-[11px] text-slate-500 truncate">For individual sellers &amp; traders</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:underline flex-shrink-0">
                Start
              </span>
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  OR
                </span>
              </div>
            </div>

            {/* Brand / Merchant Verification Card */}
            <button
              onClick={() => router.push('/brand-apply')}
              className="w-full p-3.5 bg-amber-50/30 hover:bg-amber-50/80 border border-amber-200/90 hover:border-amber-300 rounded-md transition-all text-left shadow-2xs flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs sm:text-sm text-slate-900">Verify Brand / Store</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200/60">
                      Gold
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">For registered brands &amp; businesses</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 group-hover:underline flex-shrink-0">
                Apply
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-full text-slate-400 text-xs hover:text-slate-600 font-medium py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center py-2.5 rounded-md font-bold text-xs transition-colors shadow-xs"
          >
            I Understand
          </button>
        )}
      </div>
    </div>
  );
}
