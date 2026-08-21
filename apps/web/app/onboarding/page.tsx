'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import StepProfile from '@/components/onboarding/StepProfile';
import StepLocation from '@/components/onboarding/StepLocation';
import StepPhone from '@/components/onboarding/StepPhone';
import StepIdentity from '@/components/onboarding/StepIdentity';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Check, Clock, AlertCircle, User, MapPin, Phone, FileCheck } from 'lucide-react';
import Link from 'next/link';

const steps = [
  { id: 1, name: 'Profile', icon: User },
  { id: 2, name: 'Location', icon: MapPin },
  { id: 3, name: 'Phone', icon: Phone },
  { id: 4, name: 'Identity', icon: FileCheck },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(0); // 0: Intro, 1: Profile, 2: Location, 3: Phone, 4: Identity
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRejectionBanner, setShowRejectionBanner] = useState(true);

  // Auto-dismiss rejection banner after 60 seconds
  useEffect(() => {
    if (user?.verificationStatus === 'REJECTED' && showRejectionBanner) {
      const timer = setTimeout(() => {
        setShowRejectionBanner(false);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [user?.verificationStatus, showRejectionBanner]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.isVerified) {
      router.push('/listings');
    } else if (user.verificationStatus === 'PENDING') {
      setShowSuccess(true);
    }
  }, [user, router]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    try {
      updateProfile({
        onboardingCompleted: true,
        verificationStatus: 'PENDING',
      });
      setShowSuccess(true);
    } catch (error) {
      console.error('Verification completion error:', error);
      toast.error('Failed to complete verification. Please try again.');
    }
  };

  const handleFinish = () => {
    router.push('/listings');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <img
            src="/logo-transparent.png"
            alt="BarterWave"
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Barter<span className="text-blue-600">Wave</span>
          </span>
        </Link>
      </div>

      {showSuccess ? (
        // ============================================================
        // SUCCESS SCREEN (Clean & Sharp)
        // ============================================================
        <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Verification Submitted
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
            Thank you for submitting your verification details. Our team is reviewing your documents
            and will approve your account within <strong>24 hours</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-200/90 rounded-md p-4 mb-6 text-left">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              What happens next?
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You will receive an email confirmation once verified</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You can immediately list items and participate in barter trades</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>All your trades are 100% covered by escrow protection</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-bold text-sm transition-colors shadow-xs"
          >
            Continue to Marketplace
          </button>
        </div>
      ) : (
        // ============================================================
        // MULTI-STEP ONBOARDING CONTAINER
        // ============================================================
        <div className="max-w-xl w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          {/* Segmented Step Progress Header */}
          {step > 0 && (
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-1">
                {steps.map((s) => {
                  const Icon = s.icon;
                  const isCompleted = step > s.id;
                  const isCurrent = step === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`flex-1 flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                        isCompleted
                          ? 'border-emerald-600 text-emerald-700'
                          : isCurrent
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                      </div>
                      <span className="text-xs font-semibold hidden sm:inline truncate">
                        {s.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Step 0: Intro */}
            {step === 0 && (
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                  Let&apos;s Get You Verified
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                  To ensure a safe, scam-free trading environment, we require all sellers and barter
                  traders to verify their identity.
                </p>

                {/* Why is this required section */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-md p-4 text-left mb-6">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                    Why is this required?
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Prevents fraud, duplicate accounts, and unauthorized listings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Ensures verified Nigerian trader identities and locations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Unlocks selling, direct barter swaps, and escrow payouts</span>
                    </li>
                  </ul>
                </div>

                {user.verificationStatus === 'REJECTED' && showRejectionBanner && (
                  <div className="mb-6 bg-rose-50 border border-rose-200/80 rounded-md p-4 text-left relative">
                    <button
                      onClick={() => setShowRejectionBanner(false)}
                      className="absolute top-2.5 right-2.5 text-rose-400 hover:text-rose-600"
                      title="Dismiss"
                    >
                      ×
                    </button>
                    <p className="font-bold text-rose-900 text-xs mb-1">⚠️ Verification Rejected</p>
                    <p className="text-xs text-rose-800">
                      {user.rejectionReason ||
                        'Your verification documents were rejected. Please review and submit clearer photos.'}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-4 rounded-md font-bold text-sm transition-colors shadow-xs"
                >
                  Start Verification
                </button>
              </div>
            )}

            {step === 1 && <StepProfile onNext={handleNext} onBack={handleBack} />}
            {step === 2 && <StepLocation onNext={handleNext} onBack={handleBack} />}
            {step === 3 && <StepPhone onNext={handleNext} onBack={handleBack} />}
            {step === 4 && <StepIdentity onComplete={handleComplete} onBack={handleBack} />}
          </div>
        </div>
      )}

      {!showSuccess && step > 0 && (
        <p className="mt-4 text-slate-400 text-xs font-medium">
          Step {step} of 4 &bull; Identity Verification
        </p>
      )}
    </div>
  );
}
