'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';
import { ShieldCheck, Check, AlertCircle, Clock, Building2, UserCheck } from 'lucide-react';

interface VerificationBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationBlockModal({ isOpen, onClose }: VerificationBlockModalProps) {
  const { user, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (!isOpen) return;
    refreshProfile();
    const interval = setInterval(() => {
      refreshProfile();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, refreshProfile]);

  useEffect(() => {
    if (isOpen && user?.isVerified) {
      onClose();
    }
  }, [user?.isVerified, isOpen, onClose]);

  if (!isOpen) return null;

  const isPending = user?.verificationStatus === 'PENDING';
  const isRejected = user?.verificationStatus === 'REJECTED';

  const getTitle = () => {
    if (isPending) return 'Verification Under Review';
    if (isRejected) return 'Verification Rejected';
    return 'Identity Verification Required';
  };

  const getDescription = () => {
    if (isPending)
      return 'Your verification documents are currently being reviewed. You will be able to list items and trade once approved.';
    if (isRejected)
      return 'Your previous verification attempt was rejected. Please review the reason below and submit updated details.';
    return 'To ensure a safe, scam-free marketplace for everyone, all users must verify their identity before creating listings or swap offers.';
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Top Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3.5 ${
            isRejected
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-blue-50 border border-blue-200/80 text-blue-600'
          }`}
        >
          {isRejected ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>

        {/* Title */}
        <h3
          className={`text-xl font-bold tracking-tight text-center ${
            isRejected ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {getTitle()}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 text-center leading-relaxed mt-1.5 mb-5">
          {getDescription()}
        </p>

        {/* Rejection Reason */}
        {isRejected && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-md p-3.5 mb-5 text-center">
            <p className="text-xs font-bold text-rose-900 mb-1">Reason for Rejection</p>
            <p className="text-xs text-rose-800">
              {user?.rejectionReason || 'Uploaded documents were unclear or invalid.'}
            </p>
          </div>
        )}

        {/* Checklist */}
        {!isPending && !isRejected && (
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

        {/* Action Button */}
        {!isPending ? (
          <div className="space-y-3">
            <Link
              href="/onboarding"
              className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-bold text-xs sm:text-sm text-center shadow-xs transition-colors block"
            >
              {isRejected ? 'Resubmit Verification' : 'Verify Identity Now'}
            </Link>

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

        {/* Brand Verification CTA */}
        {user?.isVerified &&
          user?.brandVerificationStatus !== 'VERIFIED_BRAND' &&
          user?.brandVerificationStatus !== 'PENDING' && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/brand-apply"
                className="flex items-center justify-between p-3 rounded-md bg-amber-50/40 border border-amber-200 text-xs text-slate-800 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">Are you a brand? Apply for Gold Badge</span>
                </div>
                <span className="text-[11px] font-bold text-amber-700 font-mono">›</span>
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}
